### Sequence

1. Both peers generate offer QR codes.
1. The peer whose QR code is first scanned becomes the leader.
1. Upon scanning the leader's QR code, the follower generates an answer QR code.
1. The leader scans the answer QR code.
1. We differentiate a leader scanning from a follower scanning by the SDP type field. One is an offer and one is an answer
