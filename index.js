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
        console.log(JSON.stringify(response));
      }
    })
  }catch(error){
    console.log('error from detect celbrities '+error);
  }

}

function detectFaces(bucket, photo){
    const params = {
        Image: {
          S3Object: {
            Bucket: bucket,
            Name: photo
          },
        },
        Attributes: ['ALL'],
      }

    client.detectFaces(params, function(err, response) {
        if (err) {
            console.log(err, err.stack); // an error occurred
        }else {
            console.log(`Detected faces for: ${photo}`);
            response.FaceDetails.forEach(data => {
                let low  = data.AgeRange.Low
                let high = data.AgeRange.High
                console.log(data.Confidence);
            })
        }
    });
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


function compareFaces(buck, source, target){
    const params = {
        SourceImage: {
            S3Object: {
              Bucket: buck,
              Name: source
            },
          },
          TargetImage: {
            S3Object: {
              Bucket: bucket,
              Name: target
            },
          },
          SimilarityThreshold: 0
    }


    client.compareFaces(params, function(err, response) {
        if (err) {
          console.log(err, err.stack); // an error occurred
        } else {
          response.FaceMatches.forEach(data => {
            let position   = data.Face.BoundingBox
            let similarity = data.Similarity
            console.log(JSON.stringify(data));
            console.log(data.Similarity);
          }) // for response.faceDetails
        } // if
      });
}


async function main(){
  
  const prompt = ps();
  let choice = prompt('[1]scan an image for celbrity information and matches [2]scan a student card and verify their credentials: ');
  if(choice == 1){
    let fileName = prompt('Please enter the filename that you would like to process( provided it has been uploaded onto the S3 bucket)');
    let bucketName = prompt('Please enter the name of the bucket containing the image: ');
    await recognizeCelebrity(fileName, bucketName);
  }else if(choice ==2){
    let textFileName = prompt('Please enter the filename that you would like to process( provided it has been uploaded onto the S3 bucket)');
    let textBucketName = prompt('Please enter the name of the bucket containing the image: ');
    textRecognition(textFileName, textBucketName);
  }
  
}

main();