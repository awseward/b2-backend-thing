export const handleAxiosError = (e: any) => {
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