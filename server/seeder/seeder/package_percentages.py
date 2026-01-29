import psycopg2
import json
import os
from dotenv import load_dotenv

# Load database URL from environment variables
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

def generate_package_percentage_json(cur, output_file='./client/src/components/data/package_percentages.json'):
    """
    This function calculates the percentage of packages in subscriptions
    and saves the result to a JSON file.

    Args:
        cur: The database cursor to execute queries.
        output_file (str): The name of the output JSON file. Defaults to 'package_percentages.json'.
    """
    # Ensure the directory exists before writing the file
    directory = os.path.dirname(output_file)
    if not os.path.exists(directory):
        os.makedirs(directory)  # Create the directory if it doesn't exist

    # Query to get the total number of subscriptions and the number of times each package appears in subscriptions
    query = """
        SELECT p."packageID", p."monthlyCost", p."annualCost", COUNT(s."packageID") AS package_count
        FROM "Package" p
        LEFT JOIN "Subscription" s ON s."packageID" = p."packageID"
        GROUP BY p."packageID"
        ORDER BY package_count DESC;
    """

    cur.execute(query)

    # Fetch all rows from the result
    package_data = cur.fetchall()

    # Get the total number of subscriptions
    cur.execute("SELECT COUNT(*) FROM \"Subscription\";")
    total_subscriptions = cur.fetchone()[0]

    # Create a dictionary to hold the package name and its percentage in subscriptions
    package_percentages = []

    for package in package_data:
        package_id, monthly_cost, annual_cost, package_count = package
        percentage = (package_count / total_subscriptions) * 100  # Calculate percentage
        package_percentages.append({
            'package_id': package_id,
            'monthly_cost': monthly_cost,
            'annual_cost': annual_cost,
            'percentage': round(percentage, 2)
        })

    # Convert the result to JSON format
    result_json = json.dumps(package_percentages, indent=4)

    # Output the JSON to the specified file path
    with open(output_file, 'w') as json_file:
        json_file.write(result_json)

    # Print confirmation
    print(f"Package percentage data has been saved to: {output_file}")
