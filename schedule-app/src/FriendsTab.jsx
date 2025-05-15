import React, { useEffect, useState } from 'react';
import { auth, db } from './firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  addDoc
} from 'firebase/firestore';
import { Button, Form, ListGroup, Container, Card } from 'react-bootstrap';

function FriendsTab() {
  const user = auth.currentUser;
  const [friendQuery, setFriendQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);

  // Fetch friend list
  useEffect(() => {
    if (!user) return;
    const ref = collection(db, 'users', user.uid, 'friends');
    const unsub = onSnapshot(ref, snapshot => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFriends(list);
    });
    return () => unsub();
  }, [user]);

  // Fetch incoming friend requests
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'friendRequests'), where('to', '==', user.uid));
    const unsub = onSnapshot(q, snap => {
      setIncomingRequests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [user]);

  // Fetch outgoing requests
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'friendRequests'), where('from', '==', user.uid));
    const unsub = onSnapshot(q, snap => {
      setOutgoingRequests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [user]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearchResults([]);
    if (!friendQuery) return;

    const field = friendQuery.includes('@') ? 'email' : 'displayName';
    const q = query(collection(db, 'users'), where(field, '==', friendQuery));
    const snap = await getDocs(q);

    const results = [];
    snap.forEach(docSnap => {
      if (docSnap.id === user.uid) return;
      if (friends.find(f => f.id === docSnap.id)) return;
      results.push({ id: docSnap.id, ...docSnap.data() });
    });

    setSearchResults(results);
    setFriendQuery('');
  };

  const sendFriendRequest = async (targetUser) => {
    await addDoc(collection(db, 'friendRequests'), {
      from: user.uid,
      to: targetUser.id,
      fromName: user.displayName || user.email,
      toName: targetUser.displayName || targetUser.email
    });
    setSearchResults([]);
  };

  const acceptRequest = async (request) => {
    const fromId = request.from;
    const toId = user.uid;

    await setDoc(doc(db, 'users', toId, 'friends', fromId), {
      friendName: request.fromName || fromId
    });
    await setDoc(doc(db, 'users', fromId, 'friends', toId), {
      friendName: user.displayName || user.email
    });
    await deleteDoc(doc(db, 'friendRequests', request.id));
  };

  const rejectRequest = async (request) => {
    await deleteDoc(doc(db, 'friendRequests', request.id));
  };

  const cancelRequest = async (request) => {
    await deleteDoc(doc(db, 'friendRequests', request.id));
  };

  const removeFriend = async (friendId) => {
    await deleteDoc(doc(db, 'users', user.uid, 'friends', friendId));
    await deleteDoc(doc(db, 'users', friendId, 'friends', user.uid));
  };

  const logout = () => {
    auth.signOut();
  };

  return (
    <>
      <Container className="pt-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3>Friends</h3>
          <Button variant="outline-danger" onClick={logout}>Logout</Button>
        </div>

        <Form onSubmit={handleSearch} className="mb-3 d-flex">
          <Form.Control
            type="text"
            placeholder="Find user by email or name"
            value={friendQuery}
            onChange={(e) => setFriendQuery(e.target.value)}
          />
          <Button type="submit" variant="primary" className="ms-2">Search</Button>
        </Form>

        {searchResults.length > 0 && (
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Search Results</Card.Title>
              <ListGroup>
                {searchResults.map(u => (
                  <ListGroup.Item key={u.id} className="d-flex justify-content-between">
                    {u.displayName || u.email}
                    <Button size="sm" onClick={() => sendFriendRequest(u)}>Add Friend</Button>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card.Body>
          </Card>
        )}

        {incomingRequests.length > 0 && (
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Incoming Friend Requests</Card.Title>
              <ListGroup>
                {incomingRequests.map(req => (
                  <ListGroup.Item key={req.id} className="d-flex justify-content-between">
                    <span>{req.fromName}</span>
                    <div>
                      <Button variant="success" size="sm" className="me-2" onClick={() => acceptRequest(req)}>Accept</Button>
                      <Button variant="danger" size="sm" onClick={() => rejectRequest(req)}>Reject</Button>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card.Body>
          </Card>
        )}

        {outgoingRequests.length > 0 && (
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Pending Requests Sent</Card.Title>
              <ListGroup>
                {outgoingRequests.map(req => (
                  <ListGroup.Item key={req.id} className="d-flex justify-content-between">
                    <span>To: {req.toName}</span>
                    <Button variant="outline-secondary" size="sm" onClick={() => cancelRequest(req)}>Cancel</Button>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card.Body>
          </Card>
        )}

        <Card className="mb-3">
          <Card.Body>
            <Card.Title>My Friends</Card.Title>
            {friends.length === 0 ? (
              <p className="text-muted">No friends yet.</p>
            ) : (
              <ListGroup>
                {friends.map(friend => (
                  <ListGroup.Item key={friend.id} className="d-flex justify-content-between">
                    {friend.friendName}
                    <Button variant="outline-danger" size="sm" onClick={() => removeFriend(friend.id)}>
                      Remove
                    </Button>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </Card.Body>
        </Card>
      </Container>
    </>
  );
}

export default FriendsTab;
