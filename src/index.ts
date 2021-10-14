import axios from 'axios';
import cors from 'cors';
import express from 'express'
import expressWinston from 'express-winston';
import winston from 'winston';
import { AppCred, B2AccountAuthorization, b2AuthorizeAccount, b2GetUploadUrl, B2GetUploadUrlResponse } from './b2';
import { HasLinks, hasLinks } from './links';

interface Req<T> extends express.Request { body: T }
type Res<T> = express.Response<T, Record<string, any>>;

const ok = <T,>(res: Res<T>, body: T) => {
  res.status(200).send(body);
}

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

type AccountAuthorizationParams = AppCred;
type AccountAuthorization =
  Pick<B2AccountAuthorization, 'apiUrl'|'authorizationToken'>
  & { bucketId: string; }
  & HasLinks<'getUploadUrl'>;
app.post(
  '/authorize_account',
  async ({ body: reqBody }: Req<AccountAuthorizationParams>, res: Res<AccountAuthorization>
) => {
  const {
    allowed: { bucketId },
    apiUrl,
    authorizationToken,
  } = await b2AuthorizeAccount(reqBody);

  ok(res, {
    ...hasLinks({
      getUploadUrl: {
        href: '/get_upload_url',
        method: 'POST',
      }
    }),
    apiUrl,
    authorizationToken,
    bucketId
  });
});

interface UploadInfoParams {
  apiUrl: string;
  authorizationToken: string;
  bucketId: string;
}
type UploadInfo = B2GetUploadUrlResponse & HasLinks<'uploadFile'>;
app.post(
  '/get_upload_url',
  async ({ body: reqBody }: Req<UploadInfoParams>, res: Res<UploadInfo>
) => {
  const { apiUrl, authorizationToken, bucketId } = reqBody;
  const b2Res = await b2GetUploadUrl(
    { apiUrl, versionNumber: 2, },
    authorizationToken,
    bucketId
  );

  ok(res, {
    ...hasLinks({
      uploadFile: {
        href: b2Res.uploadUrl,
        method: 'POST',
      }
    }),
    ...b2Res
   });
});

app.listen(port, () => console.log(`Running on port ${port}`));
