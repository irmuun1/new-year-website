import csv
import random

def load_participants(filename):
    participants = []
    with open(filename, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            participants.append(row)
    return participants

def assign_gifts(participants):
    # Create two identical lists
    choosers = participants[:]
    chosen = participants[:]
    assignments = {}

    # Randomize the order of choosers
    random.shuffle(choosers)

    for chooser in choosers:
        # Prioritize choosing someone of the opposite gender
        opposite_gender = 'm' if chooser['gender'] == 'f' else 'f'
        valid_choices = [p for p in chosen if p['gender'] == opposite_gender and p != chooser]

        if not valid_choices:
            # If no opposite-gender participants are available, fallback to same gender
            valid_choices = [p for p in chosen if p != chooser]

        # Randomly pick a person
        if valid_choices:
            pick = random.choice(valid_choices)
            assignments[chooser['email']] = pick['name']
            chosen.remove(pick)

    return assignments

def write_assignments(assignments, output_filename):
    with open(output_filename, mode='w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(['email', 'name'])
        for email, assigned_name in assignments.items():
            writer.writerow([email, assigned_name])

def main():
    input_filename = 'data/participants.csv'  # Replace with your input CSV filename
    output_filename = 'data/associations.csv'  # Replace with your output CSV filename
    
    participants = load_participants(input_filename)
    assignments = assign_gifts(participants)
    write_assignments(assignments, output_filename)

if __name__ == "__main__":
    main()
