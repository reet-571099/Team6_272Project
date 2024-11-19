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
