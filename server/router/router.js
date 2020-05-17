const express = require('express');
const MongoDB = require('mongodb').MongoClient;
const router = express.Router();

var connection = null;
MongoDB.connect("mongodb://localhost:27017", { useNewUrlParser: true }, function (error, db) {
  if (error) throw error;
  connection = db.db('xmind')
})

// 获取账单数据
router.get('/getBillData', (req, res) => {
  if (connection) {
    connection.collection('bill').aggregate([
      { $lookup: { from: 'categories', localField: 'category', foreignField: 'id', as: 'category' } },
      { $addFields: { month: { $dateToString: { format: '%m', date: { $toDate: "$time" }, timezone: 'Asia/Shanghai' } }, category: { $arrayElemAt: ["$category", 0] } } },
      {
        $match:
          req.query.month && req.query.category
            ? { $and: [{ $expr: { $in: ['$month', req.query.month.split(',')] } }, { $expr: { $in: ['$category.id', req.query.category.split(',')] } }] }
            : req.query.month
              ? { $expr: { $in: ['$month', req.query.month.split(',')] } }
              : req.query.category
                ? { $expr: { $in: ['$category.id', req.query.category.split(',')] } }
                : {}
      },
      { $skip: ((req.query.page || 1) - 1) * req.query.perPage || 20 },
      { $limit: parseInt(req.query.perPage || 20) },
      { $project: { month: 0 } },
      { $sort: { time: 1 } }
    ]).toArray(async (error, data) => {
      if (error) throw error;
      connection.collection('bill').aggregate([
        { $project: { income: { $cond: { if: { $eq: [1, '$type'] }, then: 1, else: 0 } }, outlay: { $cond: { if: { $eq: [0, '$type'] }, then: 1, else: 0 } } } },
        { $group: { _id: '$type', total: { $sum: 1 }, totalIncome: { $sum: '$income' }, totalOutlay: { $sum: '$outlay' } } }
      ]).next((error, count) => {
        if (error) throw error;
        res.send({ data, count })
      })
    })
  }
})

// 获取月份下拉数据
router.get('/getMonthData', (req, res) => {
  if (connection) {
    connection.collection('bill').aggregate([
      { $addFields: { value: { $dateToString: { format: '%m', date: { $toDate: "$time" }, timezone: 'Asia/Shanghai' } } } },
      { $group: { _id: '$value' } },
      { $project: { value: "$_id", _id: 0 } },
      { $sort: { value: 1 } }
    ]).toArray((error, data) => {
      if (error) throw error;
      res.send(data)
    })
  }
})

// 获取分类下拉数据
router.get('/getCategoryData', (req, res) => {
  if (connection) {
    connection.collection('bill').aggregate([
      { $lookup: { from: 'categories', localField: 'category', foreignField: 'id', as: 'category' } },
      { $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ["$category", 0] }, "$$ROOT"] } } },
      { $group: { _id: '$id', category: { $push: "$name" } } },
      { $project: { name: { $arrayElemAt: ["$category", 0] } } }
    ]).toArray((error, data) => {
      if (error) throw error;
      res.send(data)
    })
  }
})

// 获取标签数据
router.get('/getAllCategoryData', (req, res) => {
  if (connection) {
    connection.collection('categories').find().toArray((error, data) => {
      if (error) throw error
      res.json(data)
    });
  }
})


// 添加账单
router.post('/addBillData', (req, res) => {
  if (connection) {
    req.body.amount = parseFloat(parseFloat(req.body.amount).toFixed(2))
    req.body.type = parseFloat(req.body.type)
    connection.collection("bill").insertOne(req.body, (error, result) => {
      if (error) throw error;
      res.json({ message: '添加成功' })
    });
  }
})

// 获取统计数据
router.get('/getSummaryData', (req, res) => {
  if (connection) {
    connection.collection('bill').aggregate([
      { $lookup: { from: 'categories', localField: 'category', foreignField: 'id', as: 'category' } },
      { $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ["$category", 0] }, "$$ROOT"] } } },
      { $addFields: { month: { $dateToString: { format: '%m', date: { $toDate: "$time" }, timezone: 'Asia/Shanghai' } } } },
      { $match: req.query.month ? { $expr: { $in: ['$month', req.query.month.split(',')] } } : {} },
      { $group: { _id: { id: '$id', type: '$type' }, sum: { $sum: '$amount' }, category: { $first: "$name" }, total: { $sum: 1 } } },
      { $sort: { sum: -1 } }
    ]).toArray((error, data) => {
      if (error) throw error;
      res.json(data.reduce((obj, item) => {
        if (item._id.type == 0) {
          obj.data.push({ id: item._id.id, category: item.category, sum: item.sum })
          obj.totalOutlay += item.sum;
        } else {
          obj.totalIncome += item.sum;
        }
        obj.total += item.total;
        return obj;
      }, { data: [], total: 0, totalIncome: 0, totalOutlay: 0 }))
    })
  }
})

module.exports = router