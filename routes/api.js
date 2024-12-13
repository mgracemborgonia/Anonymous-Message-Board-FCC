'use strict';
const mongoose = require("mongoose");
require("dotenv").config;
mongoose.connect(process.env.DB);
const {Schema} = mongoose;

const date = new Date();
const replySchema = new Schema({
  text: {type: String},
  delete_password: {type: String},
  reported: {
    type: Boolean, 
    default: false
  },
  created_on: {
    type: Date,
    default: date
  },
  bumped_on: {
    type: Date,
    default: date
  }
});
const Reply = mongoose.model("Reply", replySchema);
const threadSchema = new Schema({
  board: {type: String},
  text: {type: String},
  delete_password: {type: String},
  reported: {
    type: Boolean, 
    default: false
  },
  created_on: {
    type: Date,
    default: date
  },
  bumped_on: {
    type: Date,
    default: date
  },
  replies: {type: [replySchema]}
});
const Thread = mongoose.model("Thread", threadSchema);

module.exports = function (app) {
  
  app.route('/api/threads/:board').post(async (req, res) => {
    const {text, delete_password, replies} = req.body;
    //console.log(req.body);
    try{
      const {board} = req.params;
      const date = new Date();
      if (replies) {
        replies.map(reply => {
          const new_reply = new Reply({
            text: reply.text,
            delete_password: reply.delete_password,
            reported: false,
            created_on: date,
            bumped_on: date
          });
          return new_reply;
        });
      }
      let thread = new Thread({
        board: board,
        text: text,
        delete_password: delete_password,
        reported: false,
        created_on: date,
        bumped_on: date,
        replies: []
      });
      await thread.save();
      return res.send(thread);
    }catch(err){
      console.log(err);
      res.json({error: "Invalid thread post."});
    }
  }).get(async (req, res) => {
    try{
      const {board} = req.params;
      const board_thread = await Thread.find({board: board})
      .select('-delete_password -reported')
      .sort('-bumped_on')
      .limit(10)
      .exec();
      const formatted_threads = board_thread.map(thread => {
        const {_id, text, created_on, bumped_on, replies} = thread.toObject();
        return {
          _id: _id,
          text: text,
          created_on: created_on,
          bumped_on: bumped_on,
          replies: replies.slice(-3).map(({_id, text, created_on}) => ({
            _id,
            text,
            created_on
          }))
        };
      });
      res.json(formatted_threads);
    }catch(err){
      console.log(err);
      res.json({error: "Invalid thread post."});
    }
  }).put(async (req, res) => {
      const {thread_id} = req.body;
      try{
        const {board} = req.params;
        const reported_thread = await Thread.findOneAndUpdate({
          _id: thread_id,
          board: board
        },
          {$set: {reported: true}}
        ).exec();
        if(reported_thread){
          await reported_thread.save();
          return res.send("reported");
        }else{
          return res.send("Thread not found");
        }
      }catch(err){
        console.log(err);
        res.json({error: "Invalid thread post."});
      }
    }).delete(async (req, res) => {
      const {thread_id, delete_password} = req.body;
      //console.log(req.body);
      try{
        const {board} = req.params;
        const deleted_thread = await Thread.findOne({board: board}).exec();
        if(deleted_thread){
          if(deleted_thread.delete_password === delete_password){
            deleted_thread.deleteOne({_id: thread_id});
            await deleted_thread.save();
            return res.send("success");
          }else{
            return res.send("incorrect password");
          }
        }else{
          return res.send("No board has found");
        }
      }catch(err){
        console.log(err);
        res.json({error: "Invalid thread post."});
      }
    });
    
  app.route('/api/replies/:board').post(async (req, res) => {
    const {thread_id, text, delete_password} = req.body;
    //console.log(req.body);
    try{
      const {board} = req.params;
      const date = new Date();
      const reply_board = new Reply({
        text: text,
        delete_password: delete_password,
        reported: false,
        created_on: date
      })
      const updated_thread = await Thread.findOneAndUpdate({
          _id: thread_id,
          board: board
        },{
          $push: {replies: reply_board},
          $set: {bumped_on: date}
        },
        {new: true}
      ).exec();
      if(!updated_thread){
        return res.send("Thread not found");
      }else{
        res.json(updated_thread);
      }
    }catch(err){
      console.log(err);
      res.json({error: "Invalid reply post."});
    }
  }).get(async (req, res) => {
    const {thread_id} = req.query;
    //console.log(req.body);
    try{
      const {board} = req.params;
      const reply_thread = await Thread.findOne({
        _id: thread_id,
        board: board
      }).exec();
      const reply = reply_thread.replies.map(({_id, text, created_on}) => {
        return {
          _id,
          text,
          created_on
        }
      });
      const find_thread = {
        _id: reply_thread._id,
        text: reply_thread.text,
        created_on: reply_thread.created_on,
        bumped_on: reply_thread.bumped_on,
        replies: reply
      };
      res.json(find_thread);
    }catch(err){
      console.log(err);
      res.json({error: "Invalid reply post."});
    }
    
  }).put(async (req, res) => {
    const {thread_id, reply_id} = req.body;
    //console.log(req.body);
    try{
      const {board} = req.params;
      await Thread.findOneAndUpdate({
        _id: thread_id,
        board: board,
        replies_id: reply_id
      },{
        $set: {replies_reported: true}
      }
    ).exec();
      res.send("reported");
    }catch(err){
      console.log(err);
      res.json({error: "Invalid reply post."});
    }
  }).delete(async (req, res) => {
    const {thread_id, reply_id, delete_password} = req.body;
    //console.log(req.body);
    try{
      const {board} = req.params;
      let reply_thread = await Thread.findOne({
        _id: thread_id,
        board: board
      }).exec();
      let deleted_reply = reply_thread.replies.id(reply_id);
      if (!deleted_reply || deleted_reply.delete_password !== delete_password) {
        return res.send("incorrect password");
      }else{
        const date = new Date();
        deleted_reply.text = "[deleted]";
        reply_thread.bumped_on = date;
        await reply_thread.save();
        return res.send("success");
      }
    }catch(err){
      console.log(err);
      res.json({error: "Invalid reply post."});
    }
  });
};
