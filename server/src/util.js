export const encodeMessage = (data) => JSON.stringify(data);

export const decodeMessage = (message) => JSON.parse(message);

export const requestType = {
  announce: "request_announce",
  getAllAgents: "request_get_all_agents",
};

export const responseType = {
  announce: "response_announce",
  getAllAgents: "response_get_all_agents",
};
