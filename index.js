const AWS = require('aws-sdk')
//import { RecognizeCelebritiesCommand } from  "@aws-sdk/client-rekognition";
require('dotenv').config();
const bucket= 'workshopfaces';
const photoSource = 'face_1.jpg';
const photoTarget = 'face_1 - Copy.jpg';
const imageConfidence = 0;
const config = new AWS.Config({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
  })
const client = new AWS.Rekognition();

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

  client.detectText(parmas, (err, res)=>{
    if(err){
      console.log(err);
    }else{
      console.log(res);
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


//compareFaces(bucket, photoSource, photoTarget);
//detectFaces(bucket, photoSource);
recognizeCelebrity('Brad_Pitt.jpg',bucket)