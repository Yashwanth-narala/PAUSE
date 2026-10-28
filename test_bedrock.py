import boto3
from botocore.exceptions import ClientError

REGION = "us-east-1"
MODEL_ID = "us.anthropic.claude-haiku-4-5-20251001-v1:0"

try:
    client = boto3.client(
        "bedrock-runtime",
        region_name=REGION
    )

    response = client.converse(
        modelId=MODEL_ID,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "text": "Explain PAUSE, an AI document analysis application, in two sentences."
                    }
                ]
            }
        ],
        inferenceConfig={
            "maxTokens": 100,
            "temperature": 0.2
        }
    )

    answer = response["output"]["message"]["content"][0]["text"]

    print("\nSUCCESS! Amazon Bedrock is working.")
    print("\nModel response:")
    print(answer)

except ClientError as e:
    print("\nAmazon Bedrock request failed.")
    print(e)

except Exception as e:
    print("\nUnexpected error:")
    print(e)