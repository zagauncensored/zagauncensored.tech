import ast
import json
import base64
from encryption_handler import encrypt_data, decrypt_data, load_key
from flask import Flask, render_template, request, jsonify
from pymongo import MongoClient
from bson import ObjectId
from json import JSONEncoder

app = Flask(__name__)
client = MongoClient("mongodb://localhost:27017/")
db = client["dpcdsb"]
key = load_key()

class CustomJSONEncoder(JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        return super().default(o)

@app.route('/')
def index():
    return render_template("index.html")

@app.route('/search_staff', methods=['POST'])
def search_staff():
    search_query = request.form.get('search_query', '').lower()
    pipeline = [
        {"$lookup": {
            "from": "reviews",
            "localField": "email",
            "foreignField": "staff_email",
            "as": "reviews"
        }},
        {"$addFields": {
            "avg_rating": {"$avg": "$reviews.rating"}
        }},
        {"$match": {
            "name": {"$regex": search_query, "$options": "i"}
        }}
    ]
    staff_data = db.staff.aggregate(pipeline)
    staff_data = [json.loads(CustomJSONEncoder().encode(staff)) for staff in staff_data]
    return jsonify(staff_data)

@app.route('/submit_review', methods=['POST'])
def submit_review():
    student_email = request.form.get('student_email')
    staff_email = request.form.get('staff_email')
    review_text = request.form.get('review_text')
    rating = float(request.form.get('rating'))

    # Check if student email exists in the database
    student_exists = db.students.find_one({"email": student_email})
    if not student_exists:
        return "Error: Student email not found.", 400

    # Check if a review already exists for this student-staff pair
    reviews_data = db.reviews.find({"staff_email": staff_email})
    for review in reviews_data:
        decrypted_email = decrypt_data(base64.b64decode(review['student_email']), key)
        if decrypted_email == student_email:
            return "Error: You have already submitted a review for this staff member.", 400

    # Save the review to the MongoDB collection
    encrypted_email = base64.b64encode(encrypt_data(student_email, key)).decode('utf-8')
    review = {
        "student_email": encrypted_email,
        "staff_email": staff_email,
        "review_text": review_text,
        "rating": rating,
    }
    db.reviews.insert_one(review)
    return "Review submitted successfully.", 200

@app.route('/load_reviews', methods=['POST'])
def load_reviews():
    staff_email = request.form.get('staff_email')
    reviews_data = db.reviews.find({"staff_email": staff_email})
    reviews_data = [json.loads(CustomJSONEncoder().encode(review)) for review in reviews_data]

    return jsonify(reviews_data)

def import_data(file_name, collection_name):
    with open(file_name, 'r') as file:
        data = ast.literal_eval(file.read())
        db[collection_name].insert_many(data)

if __name__ == '__main__':
    app.run(debug=True)