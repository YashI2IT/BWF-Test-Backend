from flask import Flask, request, jsonify
import joblib
import numpy as np

app = Flask(__name__)
model = joblib.load("expense_model.pkl")

@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Expense prediction API is running"}), 200


@app.route("/predict", methods=["POST"])
def predict():
    data = request.json

    number_of_girls = data["number_of_girls"]
    avg_age = data["avg_age"]
    past_food_qty = data["past_food_qty"]
    inflation_index = data["inflation_index"]  # example: 1.05 for 5%
    months = data.get("months", 12)

    input_data = np.array([[
        number_of_girls,
        avg_age,
        past_food_qty,
        inflation_index
    ]])

    base_prediction = model.predict(input_data)[0]

    monthly_predictions = []

    current_expense = base_prediction

    for month in range(1, months + 1):
        adjusted_expense = current_expense * inflation_index
        monthly_predictions.append({
            "month": month,
            "predicted_expense": round(float(adjusted_expense), 2)
        })

        current_expense = adjusted_expense

    return jsonify({
        "base_month_prediction": round(float(base_prediction), 2),
        "inflation_index_used": inflation_index,
        "monthly_forecast": monthly_predictions
    })


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)
