import json
import os

file_path = r'c:\Users\tranf\whatsapp-chatbot\apps\api\data\messages.json'

def fix_messages():
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Find the problematic message
    target_id = "msg-1769004005537"
    target_msg = None
    target_index = -1

    for i, msg in enumerate(data):
        if msg.get('id') == target_id:
            target_msg = msg
            target_index = i
            break

    if not target_msg:
        print("Message not found!")
        return

    print(f"Found message: {target_msg.get('title')}")

    # Extract data
    original_content = target_msg.get('content')
    original_image = target_msg.get('image')
    original_buttons = target_msg.get('buttons')
    
    # Create Step 1: Info (Image + Text + 'Continue' Button)
    step1_msg = {
        "id": "msg-pagamento-intro",
        "title": "pagamento",  # Keeps the entry point
        "content": original_content,
        "image": original_image,
        "buttons": [
            {
                "id": "btn-ver-pix",
                "label": "Ver Chave PIX",
                "response": "Mostrando chave PIX"
            }
        ]
    }

    # Create Step 2: Poll (Short Title + Original Action Buttons)
    step2_msg = {
        "id": "msg-pagamento-poll",
        "title": "Mostrando chave PIX", # Matches response of Step 1
        "content": "Escolha uma opção abaixo:", # Short title for Poll
        "buttons": original_buttons, # Keeps the Pix key button and nextMessage logic
        "edited": False
    }

    # Replace the old message with the two new ones
    # We insert Step 2 after Step 1, but order in JSON array doesn't matter for logic, 
    # but good for reading.
    
    # Remove old
    del data[target_index]
    
    # Insert new ones (appending to end to avoid index shifts or inserting at index)
    data.insert(target_index, step2_msg)
    data.insert(target_index, step1_msg)

    print("Writing changes...")
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print("Done!")

if __name__ == "__main__":
    fix_messages()
