const bcrypt = require('bcryptjs')
const db = require('../models')
const User = db.User
const Restaurant = db.Restaurant
const Comment = db.Comment
const Favorite = db.Favorite
const Like = db.Like
const Followship = db.Followship

const imgur = require('imgur-node-api')
const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID

const userService = {
  getUser: (req, res, callback) => {
    return User.findByPk(req.params.id, {
      include: [
        { model: Comment, include: [Restaurant] },
        { model: User, as: 'Followers' },
        { model: User, as: 'Followings' },
        { model: Restaurant, as: 'FavoritedRestaurants' }
      ]
    })
      .then(user => {
        callback({
          user: user.toJSON()
        })
      })
  },

  putUser: (req, res, callback) => {
    if (req.user.id !== Number(req.params.id)) {
      return callback({ status: 'error', message: "can't edit other's profile"})
    }

    if (!req.body.name) {
      callback({ status: 'error', message: "name didn't exist" })
    }
    const { file } = req

    if (file) {
      imgur.setClientID(IMGUR_CLIENT_ID)
      imgur.upload(file.path, (err, img) => {
        return User.findByPk(req.params.id)
          .then((user) => {
            user.update({
              name: req.body.name,
              email: req.body.eamil,
              image: file ? img.data.link : user.image
            })
              .then((user) => {
                callback({ status: 'success', message: '使用者資料編輯成功' })
              })
          })
      })
    } else {
      return User.findByPk(req.params.id)
        .then((user) => {
          user.update({
            name: req.body.name,
            email: req.body.email,
            image: user.image
          })
            .then((user) => {
              callback({ status: 'success', message: '使用者資料編輯成功' })
            })
        })
    }
  },

  addFavorite: (req, res, callback) => {
    return Favorite.create({
      UserId: req.user.id,
      RestaurantId: req.params.restaurantId
    })
      .then((restaurant) => {
        callback({ status: 'success', message: '' })
      })
  },

  removeFavorite: (req, res, callback) => {
    return Favorite.destroy({
      where: {
        UserId: req.user.id,
        RestaurantId: req.params.restaurantId
      }
    })
      .then((restaurant) => {
        callback({ status: 'success', message: '' })
      })
  },

  addLike: (req, res, callback) => {
    return Like.create({
      UserId: req.user.id,
      RestaurantId: req.params.restaurantId
    })
      .then((restaurant) => {
        callback({ status: 'success', message: '' })
      })
  },

  removeLike: (req, res, callback) => {
    return Like.destroy({
      where: {
        UserId: req.user.id,
        RestaurantId: req.params.restaurantId
      }
    })
      .then((restaurant) => {
        callback({ status: 'success', message: '' })
      })
  },

  getTopUser: (req, res, callback) => {
    // 撈出所有 User 與 followers 資料
    return User.findAll({
      include: [
        { model: User, as: 'Followers' }
      ]
    }).then(users => {
      // 整理 users 資料
      users = users.map(user => ({
        ...user.dataValues,
        // 計算追蹤者人數
        FollowerCount: user.Followers.length,
        // 判斷目前登入使用者是否已追蹤該 User 物件
        isFollowed: req.user.Followings.map(d => d.id).includes(user.id)
      }))
      // 依追蹤者人數排序清單
      users = users.sort((a, b) => b.FollowerCount - a.FollowerCount)
      return callback({ users: users })
    })
  },

  addFollowing: (req, res, callback) => {
    return Followship.create({
      followerId: req.user.id,
      followingId: req.params.userId
    })
      .then((followship) => {
        callback({ status: 'success', message: '' })
      })
  },

  removeFollowing: (req, res, callback) => {
    return Followship.findOne({
      where: { followerId: req.user.id, followingId: req.params.userId }
    })
      .then((followship) => {
        followship.destroy()
          .then((followship) => {
            callback({ status: 'success', message: '' })
          })
      })
  }
}

module.exports= userService