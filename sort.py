import ast
from rich.progress import track

# Read the file as a string
with open('./data/corrected.txt', 'r') as f:
    data = ast.literal_eval(f.read())

# Create two lists to hold the emails with 5 and 9 numbers respectively
staff = []
students = []

# Loop through the emails and extract the numbers in the email
for email_dict in track(data):
    email = email_dict['email']
    numbers = ''.join(filter(str.isdigit, email))  # extract only the digits from the email
    if len(numbers) == 5:
        staff.append(email_dict)
    elif len(numbers) == 9:
        students.append(email_dict)

# Save the emails with 5 numbers to a file
print(f"Staff: {len(staff)}")
print(f"Students: {len(students)}")
with open('staff.txt', 'w') as f:
    f.write(str(staff))

# Save the emails with 9 numbers to a file
with open('students.txt', 'w') as f:
    f.write(str(students))
