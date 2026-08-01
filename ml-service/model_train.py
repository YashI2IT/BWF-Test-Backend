import pandas as pd
from sklearn.linear_model import LinearRegression
import joblib

# Example dataset
data = {
    "number_of_girls": [20, 25, 30, 18, 22, 27],
    "avg_age": [10, 12, 11, 9, 13, 12],
    "past_food_qty": [200, 260, 300, 180, 220, 270],
    "inflation_index": [1.02, 1.03, 1.04, 1.02, 1.05, 1.03],
    "total_expense": [40000, 53000, 63000, 37000, 47000, 56000]
}

df = pd.DataFrame(data)

X = df[["number_of_girls", "avg_age", "past_food_qty", "inflation_index"]]
y = df["total_expense"]

model = LinearRegression()
model.fit(X, y)

joblib.dump(model, "expense_model.pkl")

print("Model trained with inflation!")
