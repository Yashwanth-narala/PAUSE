import boto3
from botocore.exceptions import ClientError

REGION = "us-east-1"
MODEL_ID = "amazon.nova-lite-v1:0"

client = boto3.client("bedrock-runtime", region_name=REGION)

try:
    response = client.converse(
        modelId=MODEL_ID,
        messages=[
            {
                "role": "user",
                "content": [
                    {"text": "Reply with exactly: PAUSE Bedrock test successful"}
                ],
            }
        ],
        inferenceConfig={
            "maxTokens": 100,
            "temperature": 0.1,
        },
    )

    answer = "".join(
        item.get("text", "")
        for item in response["output"]["message"]["content"]
        if "text" in item
    )

    print("SUCCESS! Amazon Nova Lite is working.")
    print("Response:", answer)

except ClientError as e:
    print("Amazon Nova Lite test failed.")
    print("AWS error:", e.response["Error"]["Code"])
    print("Details:", e.response["Error"]["Message"])