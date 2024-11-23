import json
from flask import Flask, request, render_template, jsonify
import requests
from requests.auth import HTTPBasicAuth

# Load configuration
with open("config.json") as config_file:
    config = json.load(config_file)

app = Flask(__name__)

# Jira configuration
email = config["jira"]["email"]
api_token = config["jira"]["api_token"]
jira_domain = config["jira"]["domain"]

# Authentication and headers
auth = HTTPBasicAuth(email, api_token)
headers = {
    "Accept": "application/json",
    "Content-Type": "application/json"
}

# Route to serve the HTML form as the landing page
@app.route('/')
def home():
    print("Serving the landing page.")
    return render_template('jira_form.html')

# Helper function to get account ID from email
def get_account_id(email):
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

# Endpoint to handle form submission and create a Jira story with dynamic fields
@app.route('/create_jira_story', methods=['POST'])
def create_jira_story():
    print("Received request to create Jira story.")

    data = request.json  # Capture all JSON data from the request body
    print("Incoming request data:", data)

    # Mandatory fields for Jira issue creation
    project_key = data.get("project_key")
    summary = data.get("summary")
    issue_type = data.get("issuetype", "Story")  # Default to "Story" if not specified

    if not project_key or not summary:
        print("Error: project_key and summary are required.")
        return jsonify({"status": "error", "message": "project_key and summary are required"}), 400

    # Create the base payload with mandatory fields
    payload = {
        "fields": {
            "project": {"key": project_key},
            "summary": summary,
            "issuetype": {"name": issue_type}
        }
    }

    # Handle optional fields and check for assignee email
    optional_fields = {k: v for k, v in data.items() if k not in ["project_key", "summary", "issuetype"]}
    
    # Check if assignee email is provided, and if so, retrieve account ID
    assignee_info = optional_fields.pop("assignee", None)
    assignee_email = None
    if isinstance(assignee_info, dict) and "id" in assignee_info:
        assignee_email = assignee_info["id"]
    elif isinstance(assignee_info, str):
        assignee_email = assignee_info  # if assignee was passed directly as a string email
    
    if assignee_email:
        account_id = get_account_id(assignee_email)
        if account_id:
            payload["fields"]["assignee"] = {"id": account_id}
        else:
            print(f"Assignee email '{assignee_email}' could not be resolved to an account ID.")
            return jsonify({"status": "error", "message": f"Assignee email '{assignee_email}' not found."}), 400

    # Update payload with any other optional fields
    payload["fields"].update(optional_fields)
    payload_json = json.dumps(payload)
    print("Payload for Jira API request:", payload_json)

    # Send POST request to create the story
    url = f"https://{jira_domain}/rest/api/3/issue"
    response = requests.post(url, headers=headers, data=payload_json, auth=auth)

    # Check response and log results
    if response.status_code == 201:
        response_data = response.json()
        print("Jira story created successfully:", response_data)
        return jsonify({"status": "success", "story_id": response_data["id"], "story_key": response_data["key"]})
    else:
        print("Error creating Jira story:", response.text)
        return jsonify({"status": "error", "message": response.text}), response.status_code

@app.route('/get_all_project_keys', methods=['GET'])
def get_all_project_keys():
    """
    Fetches all project keys from the Jira domain.
    """
    print("Fetching all project keys from Jira.")
    
    try:
        # Jira API endpoint to fetch all projects
        url = f"https://{jira_domain}/rest/api/3/project"
        print(f"Sending request to Jira endpoint: {url}")
        
        response = requests.get(url, headers=headers, auth=auth)
        
        # Check the response
        if response.status_code == 200:
            projects = response.json()
            project_keys = [{"key": project["key"], "name": project["name"]} for project in projects]
            print(f"Fetched {len(project_keys)} projects.")
            return jsonify({"status": "success", "projects": project_keys})
        else:
            print(f"Error fetching project keys. Jira response: {response.status_code}, {response.text}")
            return jsonify({"status": "error", "message": response.text}), response.status_code
    except requests.RequestException as req_err:
        print(f"Request error while connecting to Jira: {req_err}")
        return jsonify({
            "status": "error",
            "message": "Error while connecting to Jira. Please check your network or credentials."
        }), 500
    except Exception as e:
        print(f"Unexpected error in get_all_project_keys: {e}")
        return jsonify({
            "status": "error",
            "message": "An unexpected error occurred. Please try again later."
        }), 500


# Endpoint to get all stories from a specific sprint
@app.route('/get_sprint_stories/<sprint_id>', methods=['GET'])
def get_sprint_stories(sprint_id):
    print(f"Fetching stories for sprint ID: {sprint_id}")
    
    url = f"https://{jira_domain}/rest/agile/1.0/board/{board_id}/sprint/{sprint_id}/issue"
    response = requests.get(url, headers=headers, auth=auth)

    if response.status_code == 200:
        issues = response.json().get("issues", [])
        stories = [issue for issue in issues if issue["fields"]["issuetype"]["name"] == "Story"]
        print(f"Fetched {len(stories)} stories from sprint {sprint_id}")
        return jsonify({"status": "success", "stories": stories})
    else:
        print("Error fetching stories from sprint:", response.text)
        return jsonify({"status": "error", "message": response.text}), response.status_code

# New endpoint to get all sprints from a specific board
@app.route('/get_all_sprints', methods=['GET'])
def get_all_sprints():
    url = f"https://{jira_domain}/rest/agile/1.0/board/{board_id}/sprint"
    print("Fetching all sprints from URL:", url)

    response = requests.get(url, headers=headers, auth=auth)

    if response.status_code == 200:
        sprints = response.json().get("values", [])
        print(f"Fetched {len(sprints)} sprints.")
        return jsonify({"status": "success", "sprints": sprints})
    else:
        print("Error fetching sprints:", response.text)
        return jsonify({"status": "error", "message": response.text}), response.status_code
    
@app.route('/validate_user', methods=['POST'])
def validate_user():
    """
    Validates the user credentials and domain to check Jira board connectivity.
    """
    print("Received request to validate user credentials.")

    try:
        # Get JSON data from the request
        data = request.json
        if not data:
            print("Error: No JSON data received in the request.")
            return jsonify({
                "status": "error",
                "message": "Request body must contain JSON data."
            }), 400

        username = data.get("username")
        api_token = data.get("api_token")
        jira_domain = data.get("domain")

        # Validate required fields
        if not username or not api_token or not jira_domain:
            print("Error: Missing required fields in the request.")
            return jsonify({
                "status": "error",
                "message": "username, api_token, and domain are required"
            }), 400

        print(f"Validating user with username: {username}, domain: {jira_domain}")

        # Test API connection
        auth = HTTPBasicAuth(username, api_token)
        url = f"https://{jira_domain}/rest/api/3/myself"
        print(f"Sending request to Jira endpoint: {url}")

        try:
            response = requests.get(url, auth=auth)
        except requests.RequestException as req_err:
            print(f"Request error while connecting to Jira: {req_err}")
            return jsonify({
                "status": "error",
                "message": "Error while connecting to Jira. Please check your network or credentials."
            }), 500

        # Check the response
        if response.status_code == 200:
            print("Validation successful. User can connect to Jira.")
            return jsonify({
                "status": "success",
                "message": "Validation successful. User can connect to Jira."
            })
        else:
            print(f"Validation failed. Jira response: {response.status_code}, {response.text}")
            return jsonify({
                "status": "error",
                "message": f"Validation failed. Jira response: {response.text}"
            }), response.status_code

    except KeyError as key_err:
        print(f"KeyError: Missing key in the request data: {key_err}")
        return jsonify({
            "status": "error",
            "message": f"Missing key in request data: {key_err}"
        }), 400
    except Exception as e:
        print(f"Unexpected error in validate_user: {e}")
        return jsonify({
            "status": "error",
            "message": "An unexpected error occurred. Please try again later."
        }), 500

@app.route('/get_team_members', methods=['GET'])
def get_team_members():
    """
    Fetches team members (users) in a specific Jira project.
    """
    print("Fetching team members for a specific project.")

    try:
        # Get the project key from query parameters
        project_key = request.args.get("project_key")
        if not project_key:
            print("Error: Project key is required.")
            return jsonify({
                "status": "error",
                "message": "Project key is required as a query parameter."
            }), 400

        print(f"Fetching team members for project: {project_key}")

        # Jira API endpoint to fetch users for a project
        url = f"https://{jira_domain}/rest/api/3/user/assignable/search?project={project_key}"
        print(f"Sending request to Jira endpoint: {url}")

        response = requests.get(url, headers=headers, auth=auth)

        # Check the response
        if response.status_code == 200:
            users = response.json()
            team_members = [{"accountId": user["accountId"], "displayName": user["displayName"], "emailAddress": user.get("emailAddress")} for user in users]
            print(f"Fetched {len(team_members)} team members for project: {project_key}")
            return jsonify({"status": "success", "team_members": team_members})
        else:
            print(f"Error fetching team members. Jira response: {response.status_code}, {response.text}")
            return jsonify({"status": "error", "message": response.text}), response.status_code
    except requests.RequestException as req_err:
        print(f"Request error while connecting to Jira: {req_err}")
        return jsonify({
            "status": "error",
            "message": "Error while connecting to Jira. Please check your network or credentials."
        }), 500
    except Exception as e:
        print(f"Unexpected error in get_team_members: {e}")
        return jsonify({
            "status": "error",
            "message": "An unexpected error occurred. Please try again later."
        }), 500


# Endpoint to fetch all fields available in Jira for creating issues
@app.route('/get_all_fields', methods=['GET'])
def get_all_fields():
    url = f"https://{jira_domain}/rest/api/3/field"
    print("Fetching all fields available in Jira from URL:", url)
    
    response = requests.get(url, headers=headers, auth=auth)

    if response.status_code == 200:
        fields = response.json()
        print(f"Fetched {len(fields)} fields.")
        return jsonify({"status": "success", "fields": fields})
    else:
        print("Error fetching fields:", response.text)
        return jsonify({"status": "error", "message": response.text}), response.status_code

if __name__ == '__main__':
    print("Starting Flask application...")
    app.run(host=config["server"]["host"], port=config["server"]["port"], debug=True)
