import axios from 'axios';
import cors from 'cors';
import express from 'express'

import winston from 'winston';
import expressWinston from 'express-winston';
// Was previously:
// const winston = require('winston');
// const expressWinston = require('express-winston');

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

interface AppCred {
  keyId: string;
  key: string;
};

interface B2AccountAuthorization {
  allowed: { bucketId: string };
  apiUrl: string;
  authorizationToken: string;
};

const b2AuthorizeAccount = ({ keyId, key }: AppCred) =>
  axios.get<B2AccountAuthorization>(
    'https://api.backblazeb2.com/b2api/v2/b2_authorize_account',
    {
      auth: {
        username: keyId,
        password: key
      }
    }
  ).catch(handleAxiosError).then(res => res.data);

interface B2GetUploadUrlResponse {
  authorizationToken: string,
  bucketId: string,
  uploadUrl: string
}

const b2GetUploadUrl = (
  urlParts: Pick<UrlParts, 'apiUrl'|'versionNumber'>,
  authToken: string,
  bucketId: string
) =>
  axios.post<B2GetUploadUrlResponse>(
    mkB2Url({ ...urlParts, apiName: 'b2_get_upload_url' }),
    { bucketId },
    { headers: { 'Authorization': authToken }, }
  ).catch(handleAxiosError).then(res => res.data);

interface Req<T> extends express.Request { body: T }
type Res<T> = express.Response<T, Record<string, any>>;

const app = express();
const port = 5001;
app.use(express.json());

app.use(expressWinston.logger({
  transports: [
    new winston.transports.Console()
  ],
  format: winston.format.simple(),
  meta: true,
}));
app.use(cors());

// FIXME: Change `Res<object>` to an actually useful type
app.post('/authorize_account', async ({ body: reqBody }: Req<AppCred>, res: Res<any>) => {
  const {
    allowed: { bucketId },
    apiUrl,
    authorizationToken,
  } = await b2AuthorizeAccount(reqBody);

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

interface GetUploadUrlParams {
  apiUrl: string;
  authorizationToken: string;
  bucketId: string;
}
// FIXME: Change `Res<object>` to an actually useful type
app.post('/get_upload_url', async ({ body: reqBody }: Req<GetUploadUrlParams>, res: Res<object>) => {
  const { apiUrl, authorizationToken, bucketId } = reqBody;
  const b2Res = await b2GetUploadUrl(
    { apiUrl, versionNumber: 2, },
    authorizationToken,
    bucketId
  );
  const _links = {
    uploadFile: {
      rel: 'uploadFile',
      href: b2Res.uploadUrl,
      method: 'POST',
    },
  };

  res.status(200).send(
    {
      _links,
      ...b2Res
    }
  );
});

app.listen(port, () => console.log(`Running on port ${port}`));
