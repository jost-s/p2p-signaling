export const encodeMessage = (message) => JSON.stringify(message);
export const decodeMessage = (response) => JSON.parse(response.toString());
