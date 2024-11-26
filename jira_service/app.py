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

@app.before_request
def debug_origin():
    print("Incoming Origin:", request.headers.get("Origin"))

@app.after_request
def log_origin(response):
    print("Request Origin:", request.headers.get("Origin"))
    print("Response Access-Control-Allow-Origin:", response.headers.get("Access-Control-Allow-Origin"))
    return response

CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", "http://example.com"], "supports_credentials": True}})

#try this
# CORS(app, resources={r"/*": {"origins": "*"}})

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

# Endpoint to get the number of stories in a specific project
@app.route('/get_story_count_in_project', methods=['GET'])
def get_story_count():
    """
    Fetches the number of stories in a specific Jira project.
    """
    print("Fetching story count for a specific project.")

    # Get username from query parameters
    username = request.args.get("username")
    if not username:
        return jsonify({"status": "error", "message": "Username is required"}), 400

    # Get project key from query parameters
    project_key = request.args.get("project_key")
    if not project_key:
        return jsonify({"status": "error", "message": "Project key is required"}), 400

    # Fetch user-specific config
    user_config = get_user_config(username)
    if not user_config:
        return jsonify({"status": "error", "message": f"No configuration found for username: {username}"}), 404

    print("Config received as:", user_config)

    # Jira credentials and headers
    jira_domain = user_config["domain"]
    api_token = user_config["api_token"]
    email = user_config["email"]
    auth = HTTPBasicAuth(email, api_token)
    headers = {"Accept": "application/json", "Content-Type": "application/json"}

    # Jira API to fetch issues for the project
    url = f"https://{jira_domain}/rest/api/3/search"
    query_params = {
        "jql": f"project={project_key} AND issuetype=Story",
        "fields": "id",  # Only fetch IDs to minimize response size
        "maxResults": 0  # Jira will still return the total count
    }

    try:
        response = requests.get(url, headers=headers, auth=auth, params=query_params)
        if response.status_code == 200:
            total_stories = response.json().get("total", 0)  # Get the total count of stories
            print(f"Total stories in project {project_key}: {total_stories}")
            return jsonify({"status": "success", "project_key": project_key, "story_count": total_stories})
        else:
            print(f"Error fetching stories. Jira response: {response.status_code}, {response.text}")
            return jsonify({"status": "error", "message": response.text}), response.status_code
    except requests.RequestException as e:
        print(f"Error fetching story count: {e}")
        return jsonify({"status": "error", "message": "Error connecting to Jira"}), 500

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
        print("Response from jira for create story is : ", response)
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
    """
    Fetches all project keys from the Jira domain and includes the number of stories in each project.
    """
    print("Fetching all project keys from Jira with story counts.")

    # Get username from query parameters
    username = request.args.get("username")
    if not username:
        return jsonify({"status": "error", "message": "Username is required"}), 400

    # Fetch user-specific config
    user_config = get_user_config(username)
    if not user_config:
        return jsonify({"status": "error", "message": f"No configuration found for username: {username}"}), 404

    print("Config received as:", user_config)

    # Jira credentials and headers
    jira_domain = user_config["domain"]
    api_token = user_config["api_token"]
    email = user_config["email"]
    auth = HTTPBasicAuth(email, api_token)
    headers = {"Accept": "application/json", "Content-Type": "application/json"}

    # Jira API endpoint to fetch all projects
    url_projects = f"https://{jira_domain}/rest/api/3/project"
    try:
        # Fetch all projects
        response_projects = requests.get(url_projects, headers=headers, auth=auth)
        if response_projects.status_code != 200:
            print(f"Error fetching project keys. Jira response: {response_projects.status_code}, {response_projects.text}")
            return jsonify({"status": "error", "message": response_projects.text}), response_projects.status_code

        projects = response_projects.json()
        enriched_projects = []

        # For each project, fetch the number of stories
        for project in projects:
            project_key = project.get("key")
            project_name = project.get("name")

            # Fetch story count using Jira Search API
            url_search = f"https://{jira_domain}/rest/api/3/search"
            query_params = {
                "jql": f"project={project_key}",
                "fields": "id",
                "maxResults": 0  # Only fetch the total count
            }
            try:
                response_search = requests.get(url_search, headers=headers, auth=auth, params=query_params)
                if response_search.status_code == 200:
                    total_stories = response_search.json().get("total", 0)
                else:
                    print(f"Error fetching stories for project {project_key}: {response_search.text}")
                    total_stories = None
            except requests.RequestException as e:
                print(f"Error connecting to Jira for project {project_key}: {e}")
                total_stories = None

            # Add project with story count to the list
            enriched_projects.append({
                "key": project_key,
                "name": project_name,
                "story_count": total_stories
            })

        print(f"Fetched {len(enriched_projects)} projects with story counts.")
        return jsonify({"status": "success", "projects": enriched_projects})

    except requests.RequestException as e:
        print(f"Error fetching project keys: {e}")
        return jsonify({"status": "error", "message": "Error connecting to Jira"}), 500

@app.route('/get_team_members', methods=['GET'])
def get_team_members():
    """
    Fetches all team members (assignable users) for a specific Jira project.
    """
    print("Fetching team members for a project.")

    # Get project key and username from query parameters
    project_key = request.args.get("project_key")
    username = request.args.get("username")

    if not username:
        return jsonify({"status": "error", "message": "Username is required"}), 400

    if not project_key:
        return jsonify({"status": "error", "message": "Project key is required"}), 400

    # Fetch user-specific config
    user_config = get_user_config(username)
    if not user_config:
        return jsonify({"status": "error", "message": f"No configuration found for username: {username}"}), 404

    print(f"Fetching team members for project: {project_key} using config: {user_config}")

    # Jira credentials and headers
    jira_domain = user_config["domain"]
    api_token = user_config["api_token"]
    email = user_config["email"]
    auth = HTTPBasicAuth(email, api_token)
    headers = {"Accept": "application/json", "Content-Type": "application/json"}

    # Jira API endpoint to fetch team members
    url = f"https://{jira_domain}/rest/api/3/user/assignable/search"
    params = {"project": project_key}

    try:
        # Send GET request to fetch assignable users
        response = requests.get(url, headers=headers, auth=auth, params=params)
        if response.status_code == 200:
            users = response.json()
            # Extract usernames and emails
            team_members = [{"username": user["displayName"], "email": user.get("emailAddress", "N/A")} for user in users]
            print(f"Fetched {len(team_members)} team members for project: {project_key}")
            return jsonify({"status": "success", "team_members": team_members})
        else:
            print(f"Error fetching team members. Jira response: {response.status_code}, {response.text}")
            return jsonify({"status": "error", "message": response.text}), response.status_code
    except requests.RequestException as e:
        print(f"Error connecting to Jira for project {project_key}: {e}")
        return jsonify({"status": "error", "message": "Error connecting to Jira. Please check your network and credentials."}), 500
    
@app.route('/get_all_issues_in_project', methods=['GET'])
def get_all_issues():
    """
    Fetches all issues for a specific Jira project.
    """
    print("Fetching all issues for a project.")

    # Get project key and username from query parameters
    project_key = request.args.get("project_key")
    username = request.args.get("username")

    if not username:
        return jsonify({"status": "error", "message": "Username is required"}), 400

    if not project_key:
        return jsonify({"status": "error", "message": "Project key is required"}), 400

    # Fetch user-specific config
    user_config = get_user_config(username)
    if not user_config:
        return jsonify({"status": "error", "message": f"No configuration found for username: {username}"}), 404

    print(f"Fetching issues for project: {project_key} using config: {user_config}")

    # Jira credentials and headers
    jira_domain = user_config["domain"]
    api_token = user_config["api_token"]
    email = user_config["email"]
    auth = HTTPBasicAuth(email, api_token)
    headers = {"Accept": "application/json", "Content-Type": "application/json"}

    # Jira API endpoint to fetch issues for a project
    url = f"https://{jira_domain}/rest/api/3/search"
    params = {"jql": f"project={project_key}", "maxResults": 100}

    try:
        # Send GET request to fetch issues
        response = requests.get(url, headers=headers, auth=auth, params=params)
        if response.status_code == 200:
            issues = response.json()
            # Extract issue details
            all_issues = [
                {
                    "key": issue["key"],
                    "summary": issue["fields"]["summary"],
                    "status": issue["fields"]["status"]["name"],
                    "assignee": issue["fields"]["assignee"]["displayName"] if issue["fields"].get("assignee") else "Unassigned",
                    "created": issue["fields"]["created"]
                }
                for issue in issues.get("issues", [])
            ]
            print(f"Fetched {len(all_issues)} issues for project: {project_key}")
            return jsonify({"status": "success", "issues": all_issues})
        else:
            print(f"Error fetching issues. Jira response: {response.status_code}, {response.text}")
            return jsonify({"status": "error", "message": response.text}), response.status_code
    except requests.RequestException as e:
        print(f"Error connecting to Jira for project {project_key}: {e}")
        return jsonify({"status": "error", "message": "Error connecting to Jira. Please check your network and credentials."}), 500


if __name__ == '__main__':
    print("Starting Flask application...")
    app.run(host=config["server"]["host"], port=config["server"]["port"], debug=True)
