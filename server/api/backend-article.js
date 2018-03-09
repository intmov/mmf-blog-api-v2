var moment = require('moment')
var mongoose = require('../mongoose')
var Article = mongoose.model('Article')
var Category = mongoose.model('Category')
const general = require('./general')

const list = general.list
const item = general.item

// var marked = require('marked')
// var hljs = require('highlight.js')
// marked.setOptions({
//     highlight(code) {
//         return hljs.highlightAuto(code).value
//     },
//     breaks: true
// })

/**
 * 管理时, 获取文章列表
 * @method
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
exports.getList = (req, res) => {
    list(req, res, Article, '-update_date')
}

/**
 * 管理时, 获取单篇文章
 * @method
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
exports.getItem = (req, res) => {
    item(req, res, Article)
}

/**
 * 发布文章
 * @method
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
exports.insert = (req, res) => {
    var content = req.body.content
    var readtime = req.body.readtime2
    var category = req.body.username
    var category_name = req.body.username
    var title = req.body.items2.substr(0,20)
    var data = {
        title,
        category,
        category_name,
        content,
        html:content,
        visit: 0,
        like: 0,
        comment_count: 0,
        creat_date: req.body.date,
        update_date: moment().format('YYYY-MM-DD HH:mm:ss'),
        is_delete: 0,
        timestamp: moment().format('X'),
        userid: req.body.userid,
        username: req.body.username,
        readtime: readtime,
        items: req.body.items2,
        meditation: req.body.meditation,
        chapters: req.body.chapters
    }
    Article.createAsync(data).then(result => {
        return res.json({
            code: 200,
            message: '发布成功',
            data: result
        })
        // return User.updateAsync({ _id: category }, { '$inc': { 'cate_num': 1 } }).then(() => {
        //     return res.json({
        //         code: 200,
        //         message: '发布成功',
        //         data: result
        //     })
        // })
    }).catch(err => {
        res.json({
            code: -200,
            message: err.toString()
        })
    })
}

/**
 * 管理时, 删除文章
 * @method
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
exports.deletes = (req, res) => {
    var id = req.query.id
    const data = {}
    if(id){
        data._id = id
    }else{
        data.creat_date = req.query.date
        data.userid = req.query.userid
        data.is_delete = 0
    }
    console.log(data)
    Article.updateAsync(data, { is_delete: 1 }).then(() => {
        return Category.updateAsync( data , { '$inc': { 'cate_num': -1 } }).then(result => {
            res.json({
                code: 200,
                message: '更新成功',
                data: result
            })
        })
    }).catch(err => {
        res.json({
            code: -200,
            message: err.toString()
        })
    })
}

/**
 * 管理时, 恢复文章
 * @method
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
exports.recover = (req, res) => {
    var id = req.query.id
    Article.updateAsync({ _id: id }, { is_delete: 0 }).then(() => {
        return Category.updateAsync({ _id: id }, { '$inc': { 'cate_num': 1 } }).then(() => {
            res.json({
                code: 200,
                message: '更新成功',
                data: 'success'
            })
        })
    }).catch(err => {
        res.json({
            code: -200,
            message: err.toString()
        })
    })
}

/**
 * 管理时, 编辑文章
 * @method
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
exports.modify = (req, res) => {
    var category = req.body.category,
        category_old = req.body.category_old,
        content = req.body.content,
        html = marked(content),
        id = req.body.id

    var data = {
        title: req.body.title,
        category: req.body.category,
        category_name: req.body.category_name,
        content,
        html,
        update_date: moment().format('YYYY-MM-DD HH:mm:ss')
    }
    Article.findOneAndUpdateAsync({ _id: id }, data, { new: true }).then(result => {
        if (category !== category_old) {
            Promise.all([
                Category.updateAsync({ _id: category }, { '$inc': { 'cate_num': 1 } }),
                Category.updateAsync({ _id: category_old }, { '$inc': { 'cate_num': -1 } })
            ]).then(() => {
                res.json({
                    code: 200,
                    message: '更新成功',
                    data: result
                })
            })
        } else {
            res.json({
                code: 200,
                message: '更新成功',
                data: result
            })
        }
    }).catch(err => {
        res.json({
            code: -200,
            message: err.toString()
        })
    })
}
