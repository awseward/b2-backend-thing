import axios from 'axios';
import cors from 'cors';
import express from 'express'

interface AppCred {
  keyId: string;
  key: string;
};

interface GetUploadUrlParams {
  apiUrl: string;
  authorizationToken: string;
  bucketId: string;
}

interface UrlParts {
  apiUrl: string; // returned by b2_authorize_account
  versionNumber: number;
  apiName: string;
}

const mkB2Url = ({ apiUrl, versionNumber, apiName }: UrlParts) =>
  `${apiUrl}/b2api/v${versionNumber}/${apiName}`;

const handleAxiosError = (e: any) => {
  if (e.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.log(e.response.data);
    console.log(e.response.status);
    console.log(e.response.headers);
  } else if (e.request) {
    // The request was made but no response was received
    // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
    // http.ClientRequest in node.js
    console.log(e.request);
  } else {
    // Something happened in setting up the request that triggered an Error
    console.log('Error', e.message);
  }
  console.log(e.config);

  throw e;
}

const b2AuthorizeAccount = ({ keyId, key }: AppCred) : Promise<any> =>
  axios.get(
    'https://api.backblazeb2.com/b2api/v2/b2_authorize_account',
    {
      auth: {
        username: keyId,
        password: key
      }
    }
  ).catch(handleAxiosError);

interface B2GetUploadUrlResponse {
  authorizationToken: string,
  bucketId: string,
  uploadUrl: string
}

const b2GetUploadUrl = (
  urlParts: UrlParts,
  authToken: string,
  bucketId: string
) : Promise<any> =>
  axios.post(
    mkB2Url({ ...urlParts, apiName: 'b2_get_upload_url' }),
    { bucketId },
    {
      headers: { 'Authorization': authToken },
    }
  ).catch(handleAxiosError);

interface Req<T> extends express.Request { body: T }

const app = express();
const port = 5001;
app.use(express.json());

const winston = require('winston');
const expressWinston = require('express-winston');

app.use(expressWinston.logger({
  transports: [
    new winston.transports.Console()
  ],
  format: winston.format.simple(),
  meta: true,
}));

app.use(cors());

app.post('/authorize_account', async (req: Req<AppCred>, res) => {
  const b2Res = await b2AuthorizeAccount(req.body);
  const {
    allowed: { bucketId },
    apiUrl,
    authorizationToken,
  } = b2Res.data;

  const _links = {
    getUploadUrl: {
      rel: 'getUploadUrl',
      href:  '/get_upload_url',
      method: 'POST',
    },
  };

  res.status(200).send({
    _links,
    apiUrl,
    authorizationToken,
    bucketId
  });
});

app.post('/get_upload_url', async (req: Req<GetUploadUrlParams>, res) => {
  const { apiUrl, authorizationToken, bucketId } = req.body;
  const b2Res = await b2GetUploadUrl(
    {
      apiUrl,
      versionNumber: 2,
      apiName: '', // Not actually used in this call -- probably going to remove from the interface and shape things a little differently…
    },
    authorizationToken,
    bucketId
  );

  const _links = {
    uploadFile: {
      rel: 'uploadFile',
      href: b2Res.data.uploadUrl,
      method: 'POST',
    },
  };

  res.status(200).send(
    {
      _links,
      ...b2Res.data
    }
  );
});

app.listen(port, () => console.log(`Running on port ${port}`));
