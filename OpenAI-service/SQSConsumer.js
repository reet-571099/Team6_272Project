const { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } = require('@aws-sdk/client-sqs');
const { processS3File } = require('./openAIClient');

 const sqsClient = new SQSClient({ 
    region: 'us-west-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  });
const queueUrl = 'https://sqs.us-west-1.amazonaws.com/402182691546/story_queue'; //get queue url

const listenForMessages = async () => {
  try {
    while (true) {
      const data = await sqsClient.send(
        new ReceiveMessageCommand({
          QueueUrl: queueUrl,
          MaxNumberOfMessages: 10, 
          WaitTimeSeconds: 20,     
          VisibilityTimeout: 30,    
        })
      );

      if (data.Messages && data.Messages.length > 0) {
        console.log('Received Messages:', data.Messages);

        for (const message of data.Messages) {
            const messageBody = JSON.parse(message.Body);

            const fileUrl = messageBody.file_url;
            const urlObj = new URL(fileUrl);
            const bucket = urlObj.hostname.split('.')[0]; 
            const key = decodeURIComponent(urlObj.pathname.substring(1))
  
            
            await processS3File(bucket, key, messageBody.user_id, messageBody.project_id);
  
           
            await sqsClient.send(
              new DeleteMessageCommand({
                QueueUrl: queueUrl,
                ReceiptHandle: message.ReceiptHandle,
              })
            );
          }
      } else {
        console.log('No messages received, waiting...');
      }
    }
  } catch (error) {
    console.error('Error receiving messages:', error);
  }
};

module.exports = { listenForMessages };
