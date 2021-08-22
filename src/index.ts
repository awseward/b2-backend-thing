import express from 'express'

interface AppCred {
  keyId: string;
  key: string;
};

interface UrlParts {
  apiUrl: string; // returned by b2_authorize_account
  versionNumber: number;
  apiName: string;
}

interface Req<T> extends express.Request { body: T }

export const mkAuthHeader = ({ keyId, key }: AppCred) => {
  const encoded = Buffer.from(`${keyId}:${key}`).toString('base64');
  return `Basic ${encoded}`;
}

export const mkUrl = ({ apiUrl, versionNumber, apiName }: UrlParts) =>
  `${apiUrl}/b2api/v${versionNumber}/${apiName}`;

const app = express();
const port = 5001;

app.use(express.json());

// curl -XPOST localhost:5001/get_upload_url -H 'Content-Type: application/json' -d '{ "keyId": "foo", "key": "bar" }'
app.post('/get_upload_url', (req: Req<AppCred>, res) => {
  // TODO: Figure out how to make this error if the req body doesn't match the interface we're expecting…
  res.status(501).send(`TODO: ${mkAuthHeader(req.body)}\n`);
});

app.listen(port, () => console.log(`Running on port ${port}`));
