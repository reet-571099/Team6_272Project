import json
from flask import Flask, request, render_template, jsonify
import requests
from requests.auth import HTTPBasicAuth
from pymongo import MongoClient
import certifi
from flask_cors import CORS
import datetime

# Load configuration
with open("config.json") as config_file:
    config = json.load(config_file)

# Initialize Flask app
app = Flask(__name__)

# Enable CORS globally with explicit configuration
CORS(app, resources={r"/*": {"origins": ["http://localhost:3000"], "supports_credentials": True}})

# MongoDB connection
MONGODB_URL = "mongodb+srv://admin:dbUserPassword@rajat-sjsu.ht3fo.mongodb.net/cmpe_272?retryWrites=true&w=majority&tls=true"
mongo_client = MongoClient(MONGODB_URL, tlsCAFile=certifi.where())

# Access database and collection
db = mongo_client["cmpe_272"]
users_collection = db["users"]

# Helper function to get account ID from email
def get_account_id(email, jira_domain, auth, headers):
    """
    Fetches the account ID for a given email using the Jira domain and authentication details.
    """
    print(f"Looking up account ID for email: {email}")
    url = f"https://{jira_domain}/rest/api/3/user/search?query={email}"
    response = requests.get(url, headers=headers, auth=auth)

    if response.status_code == 200:
        users = response.json()
        if users:
            account_id = users[0]["accountId"]
            print(f"Found account ID for {email}: {account_id}")
            return account_id
        else:
            print(f"No user found for email: {email}")
            return None
    else:
        print(f"Error fetching account ID for {email}: {response.text}")
        return None

def get_user_config(username):
    """
    Fetches configuration details for the given username (email) from MongoDB.
    """
    print(f"Fetching configuration for username: {username}")
    user_config = users_collection.find_one({"username": username, "is_deleted": False})
    
    if not user_config:
        print(f"Configuration not found for username: {username}")
        return None

    # Return only the required fields
    return {
        "email": user_config["username"],
        "domain": user_config["domain"],
        "api_token": user_config["api_token"]
    }

# Route to serve the HTML form as the landing page
@app.route('/')
def home():
    print("Serving the landing page.")
    return render_template('jira_form.html')

@app.route('/validate_user', methods=['POST'])
def validate_user():
    """
    Validates the user credentials and domain to check Jira connectivity.
    If successful, stores or updates user details in MongoDB.
    """
    print("Received request to validate user credentials.")

    try:
        # Get JSON data from the request body
        data = request.json
        if not data:
            print("Error: No JSON data received in the request.")
            return jsonify({"status": "error", "message": "Request body must contain JSON data."}), 400

        # Extract credentials from the request
        username = data.get("username")
        api_token = data.get("api_token")
        jira_domain = data.get("domain")

        # Validate required fields
        if not username or not api_token or not jira_domain:
            print("Error: Missing required fields in the request.")
            return jsonify({"status": "error", "message": "username, api_token, and domain are required"}), 400

        # Set up authentication
        auth = HTTPBasicAuth(username, api_token)

        # Test API connection
        url = f"https://{jira_domain}/rest/api/3/myself"
        print(f"Sending request to Jira endpoint: {url}")

        response = requests.get(url, auth=auth)

        # Check response status
        if response.status_code == 200:
            print("Validation successful. User can connect to Jira.")

            # Save or update user details in MongoDB
            try:
                user_details = {
                    "username": username,
                    "api_token": api_token,
                    "domain": jira_domain,
                    "is_deleted": False,  # Ensure the entry is marked as active
                    "updatedAt": datetime.datetime.utcnow()
                }

                # Check if the user already exists
                existing_user = users_collection.find_one({"username": username})

                if existing_user:
                    # Update existing user details
                    print(f"Updating existing user details for username: {username}")
                    users_collection.update_one({"username": username}, {"$set": user_details})
                else:
                    # Insert new user details
                    print(f"Inserting new user details for username: {username}")
                    user_details["createdAt"] = datetime.datetime.utcnow()
                    users_collection.insert_one(user_details)

            except Exception as db_err:
                print(f"Error saving user details to MongoDB: {db_err}")
                return jsonify({"status": "error", "message": "Error saving user details to the database."}), 500

            return jsonify({"status": "success", "message": "Validation successful. User can connect to Jira."})

        else:
            print(f"Validation failed. Jira response: {response.status_code}, {response.text}")
            return jsonify({"status": "error", "message": response.text}), response.status_code

    except requests.RequestException as req_err:
        print(f"Request error while connecting to Jira: {req_err}")
        return jsonify({"status": "error", "message": "Error connecting to Jira. Please check your credentials and network."}), 500
    except Exception as e:
        print(f"Unexpected error in validate_user: {e}")
        return jsonify({"status": "error", "message": "An unexpected error occurred. Please try again later."}), 500

# Endpoint to handle form submission and create a Jira story
@app.route('/create_jira_story', methods=['POST'])
def create_jira_story():
    print("Received request to create Jira story.")
    username = request.args.get("username")
    if not username:
        return jsonify({"status": "error", "message": "Username is required"}), 400

    user_config = get_user_config(username)
    if not user_config:
        return jsonify({"status": "error", "message": f"No configuration found for username: {username}"}), 404
    print("Config received as:", user_config)
    jira_domain = user_config["domain"]
    api_token = user_config["api_token"]
    email = user_config["email"]
    auth = HTTPBasicAuth(email, api_token)
    headers = {"Accept": "application/json", "Content-Type": "application/json"}

    data = request.json
    print("Incoming request data:", data)

    project_key = data.get("project_key")
    summary = data.get("summary")
    issue_type = data.get("issuetype", "Story")

    if not project_key or not summary:
        return jsonify({"status": "error", "message": "project_key and summary are required"}), 400

    payload = {
        "fields": {
            "project": {"key": project_key},
            "summary": summary,
            "issuetype": {"name": issue_type}
        }
    }

    assignee_email = data.get("assignee")
    if assignee_email:
        account_id = get_account_id(assignee_email, jira_domain, auth, headers)
        if account_id:
            payload["fields"]["assignee"] = {"id": account_id}
        else:
            return jsonify({"status": "error", "message": f"Assignee email '{assignee_email}' not found."}), 400

    description = data.get("description")
    if description:
        payload["fields"]["description"] = {
            "type": "doc",
            "version": 1,
            "content": [
                {
                    "type": "paragraph",
                    "content": [
                        {"type": "text", "text": description}
                    ]
                }
            ]
        }

    optional_fields = {k: v for k, v in data.items() if k not in ["project_key", "summary", "issuetype", "description", "assignee"]}
    payload["fields"].update(optional_fields)

    payload_json = json.dumps(payload)
    print("Payload for Jira API request:", payload_json)

    url = f"https://{jira_domain}/rest/api/3/issue"
    try:
        response = requests.post(url, headers=headers, data=payload_json, auth=auth)
        if response.status_code == 201:
            return jsonify({"status": "success", "story_id": response.json()["id"], "story_key": response.json()["key"]})
        else:
            return jsonify({"status": "error", "message": response.text}), response.status_code
    except requests.RequestException as e:
        print(f"Error creating Jira story: {e}")
        return jsonify({"status": "error", "message": "Error connecting to Jira"}), 500

# Endpoint to fetch all project keys
@app.route('/get_all_project_keys', methods=['GET'])
def get_all_project_keys():
    print("Fetching all project keys from Jira.")
    username = request.args.get("username")
    if not username:
        return jsonify({"status": "error", "message": "Username is required"}), 400

    user_config = get_user_config(username)
    if not user_config:
        return jsonify({"status": "error", "message": f"No configuration found for username: {username}"}), 404
    print("Config received as:", user_config)

    jira_domain = user_config["domain"]
    api_token = user_config["api_token"]
    email = user_config["email"]
    auth = HTTPBasicAuth(email, api_token)
    headers = {"Accept": "application/json", "Content-Type": "application/json"}

    url = f"https://{jira_domain}/rest/api/3/project"
    try:
        response = requests.get(url, headers=headers, auth=auth)
        if response.status_code == 200:
            projects = response.json()
            return jsonify({"status": "success", "projects": [{"key": p["key"], "name": p["name"]} for p in projects]})
        else:
            return jsonify({"status": "error", "message": response.text}), response.status_code
    except requests.RequestException as e:
        print(f"Error fetching project keys: {e}")
        return jsonify({"status": "error", "message": "Error connecting to Jira"}), 500

# Add other APIs like `/get_team_members`, `/get_all_fields`, etc. dynamically configured
# You can restore them as required and apply the same dynamic configuration logic.


if __name__ == '__main__':
    print("Starting Flask application...")
    app.run(host=config["server"]["host"], port=config["server"]["port"], debug=True)
