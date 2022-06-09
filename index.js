const AWS = require('aws-sdk');
const ps = require('prompt-sync');
require('dotenv').config();
const config = new AWS.Config({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
  })
AWS.config.update(config);

const client = new AWS.Rekognition();
const docClient = new AWS.DynamoDB.DocumentClient();

function registerStudent(studentID, studentNumber, studentTitleName, universityName){
  const params = {
    TableName: "student",
    Item: {
      "student_id":studentID,
      "student_number": studentNumber,
      "student_title_name": studentTitleName,
      "university_name": universityName,
    }
  };

  docClient.put(params, function(err, data) {
    if(err){
      console.log("ERROR", err);
    }else{
      console.log(`Student number: ${studentNumber} has been registered to the student database`);
    }
  });
}

async function recognizeCelebrity(celebPhoto, celebBucket){
  const params = {
    Image: {
      S3Object: {
        Bucket: celebBucket,
        Name: celebPhoto
      },
    },
  }

  try{
    client.recognizeCelebrities(params,(err, response)=>{
      if(err){  
        console.log(err, err.stack);
      }else{
        let responses = response.CelebrityFaces.length;
        console.log(`It has been determined that there were ${responses}. The following is a summary on the celbrities that could be matched \n`);
        response.CelebrityFaces.forEach(function(item, index){
          let celebName = item.Name;
          let faceConfidence = item.Face.Confidence;
          let emotion = item.Face.Emotions[0].Type;
          let emotionConfidence = item.Face.Emotions[0].Confidence;
          let gender = item.KnownGender;
          let pronoun = '';
          if(gender == 'Female'){
            pronoun = 'she';
          }else{
            pronoun = 'he';
          }
          console.log('\n');
          console.log(`We are ${faceConfidence} sure that we have detected ${celebName} \nWe have also determined that ${pronoun} is feeling ${emotion}...\n and you can trust us, after all we're ${emotionConfidence}% sure of it!`);
          console.log('===========================================================================================================================================');
        });
      }
    })
  }catch(error){
    console.log('error from detect celbrities '+error);
  }

}

function textRecognition(textPhoto, textBucket){
  const params = {
    Image: {
      S3Object: {
        Bucket: textBucket,
        Name: textPhoto
      },
    },
  }

    client.detectText(params, (err, res)=>{
      if(err){
        console.log(err);
      }else{
        //indexes uni=1, credentials=3, studentNumber=4
        let uni = res.TextDetections[1].DetectedText;
        let credentails = res.TextDetections[3].DetectedText;
        let strStudentNumber = res.TextDetections[4].DetectedText;
        let studentNumber = parseInt(strStudentNumber);

        registerStudent(studentNumber, studentNumber, credentails, uni);
      }
    });
}

async function main(){
  
  const prompt = ps();
  let choice = prompt('[1]scan an image for celbrity information and matches [2]scan a student card and verify their credentials: ');
  if(choice == 1){
    let fileName = prompt('Please enter the filename that you would like to process( provided it has been uploaded onto the S3 bucket): ');
    let bucketName = prompt('Please enter the name of the bucket containing the image: ');
    await recognizeCelebrity(fileName, bucketName);
  }else if(choice ==2){
    let textFileName = prompt('Please enter the filename that you would like to process( provided it has been uploaded onto the S3 bucket): ');
    let textBucketName = prompt('Please enter the name of the bucket containing the image: ');
    textRecognition(textFileName, textBucketName);
  }
  
}

main();