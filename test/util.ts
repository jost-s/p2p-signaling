import getPort from "get-port";

export const getServerUrl = async () =>
  new URL(`ws://localhost:${await getPort()}`);

export const fakeIceCandidate = (): RTCIceCandidate => ({
  address: null,
  candidate: "ice",
  component: null,
  foundation: null,
  port: null,
  priority: null,
  protocol: null,
  relatedAddress: null,
  relatedPort: null,
  sdpMid: null,
  sdpMLineIndex: null,
  tcpType: null,
  type: null,
  usernameFragment: null,
  toJSON: () =>
    JSON.parse(
      `{"address":null,"candidate":"ice","component":null,"foundation":null,"port":null,"priority":null,"protocol":null,"relatedAddress":null,"relatedPort":null,"sdpMid":null,"sdpMLineIndex":null,"tcpType":null,"type":null,"usernameFragment":null}`
    ),
});
