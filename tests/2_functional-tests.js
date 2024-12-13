const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
const threads_url = "/api/threads/";
const replies_url = "/api/replies/";

chai.use(chaiHttp);

let testThreadId = null;
suite('Functional Tests', function() {
    suite("Threads", () => {
        test('Create new thread', (done) => {
            chai.request(server)
            .post(`${threads_url}test-board`)
            .send({ text: 'my test', delete_password: 'aaa', replies: [{
                text: 'test reply',
                delete_password: 'aaa'
            }]})
            .end((err, res) => {
                assert.deepEqual(
                    res.status, 200,
                    res.body.text, 'my test',
                    res.body.delete_password, 'aaa',
                    res.body.reported, false
                );
                testThreadId = res.body._id
                done();
            });
        });
        test("Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}", (done) => {
            chai.request(server)
            .get(`${threads_url}test-board`)
            .end((err, res) => {
                assert.equal(
                    res.status, 200,
                );
                done();
            });
        });
        test("Deleting a thread with the incorrect password: DELETE request to /api/threads/{board} with an invalid delete_password", (done) => {
            chai.request(server)
            .delete(`${threads_url}test-board`)
            .send({thread_id: testThreadId, delete_password: "wrong"})
            .end((err, res) => {
                assert.deepEqual(
                    res.status, 200,
                    res.text, "incorrect password"
                );
                done();
            });
        });
        test("Deleting a thread with the correct password: DELETE request to /api/threads/{board} with a valid delete_password", (done) => {
            chai.request(server)
            .delete(`${threads_url}test-board`)
            .send({thread_id: testThreadId, delete_password: "aaa"})
            .end((err, res) => {
                assert.deepEqual(
                    res.status, 200,
                    res.text, "success"
                );
                done();
            });
        });
        test("Reporting a thread: PUT request to /api/threads/{board}", function (done) {
            chai.request(server)
            .put(`${threads_url}test-board`)
            .send({thread_id: testThreadId})
            .end((err, res) => {
                assert.deepEqual(
                    res.status, 200,
                    res.text, "reported"
                );
                done();
            });
        });
    });
    suite("Replies", () =>{
        test("Creating a new reply: POST request to /api/replies/{board}", (done) => {
            chai.request(server)
            .post(`${replies_url}test-board`)
            .send({thread_id: testThreadId, text: "my reply", delete_password: "aaa"})
            .end((err, res) => {
                assert.deepEqual(
                    res.status, 200,
                    res.body.text, 'my reply',
                    res.body.delete_password, 'aaa',
                );
                done();
            });
        });
        test("Viewing a single thread with all replies: GET request to /api/replies/{board}", (done) => {
            chai.request(server)
            .get(`${replies_url}test-board`)
            .query({thread_id: testThreadId})
            .end((err, res) => {
                assert.equal(
                    res.status, 200,
                );
                done();
            });
        });
        test("Deleting a reply with the incorrect password: DELETE request to /api/replies/{board} with an invalid delete_password", (done) => {
            chai.request(server)
            .delete(`${replies_url}test-board`)
            .send({thread_id: testThreadId, reply_id: testThreadId.replies, delete_password: "wrong"})
            .end((err, res) => {
                assert.deepEqual(
                    res.status, 200,
                    res.text, "incorrect password"
                );
                done();
            });
        });
        test("Deleting a reply with the correct password: DELETE request to /api/replies/{board} with a valid delete_password", (done) => {
            chai.request(server)
            .delete(`${replies_url}test-board`)
            .send({thread_id: testThreadId, reply_id: testThreadId.replies, delete_password: "aaa"})
            .end((err, res) => {
                assert.deepEqual(
                    res.status, 200,
                    res.text, "success"
                );
                done();
            });
        });
        test("Reporting a reply: PUT request to /api/replies/{board}", (done) => {
            chai.request(server)
            .put(`${replies_url}test-board`)
            .send({thread_id: testThreadId, reply_id: testThreadId.replies})
            .end((err, res) => {
                assert.deepEqual(
                    res.status, 200,
                    res.text, "reported"
                );
                done();
            });
        });
    });
});
