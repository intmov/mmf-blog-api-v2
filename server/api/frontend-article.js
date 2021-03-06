var mongoose = require('../mongoose')
var moment = require('moment')
var Article = mongoose.model('Article')
var Like = mongoose.model('Like')
var User = mongoose.model('User')

/**
 * 前台浏览时, 获取文章列表
 * @method
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
exports.getListo = (req, res) => {
    var by = req.query.by,
        id = req.query.id,
        key = req.query.key,
        limit = req.query.limit,
        page = req.query.page
    page = parseInt(page, 10)
    limit = parseInt(limit, 10)
    if (!page) page = 1
    if (!limit) limit = 10
    var data = {
            is_delete: 0
        },
        skip = (page - 1) * limit
    if (id) {
        data.category = id
    }
    if (key) {
        var reg = new RegExp(key, 'i')
        data.title = {$regex : reg}
    }
    var sort = '-update_date'
    if (by) {
        sort = '-' + by
    }

    var filds = 'title content category category_name visit like comment_count creat_date update_date is_delete timestamp user items items2 readtime'

    Promise.all([
        Article.find(data, filds).sort(sort).skip(skip).limit(limit).exec(),
        Article.countAsync(data)
    ]).then(([data, total]) => {
        var arr = [],
            totalPage = Math.ceil(total / limit),
            user_id = req.cookies.userid
        data = data.map(item => {
            item.content = item.content.substring(0, 500)
            return item
        })
        var json = {
            code: 200,
            data: {
                list: data,
                total,
                hasNext: totalPage > page ? 1 : 0,
                hasPrev: page > 1
            }
        }
        if (user_id) {
            data.forEach(item => {
                arr.push(Like.findOneAsync({ article_id: item._id, user_id }))
            })
            Promise.all(arr).then(collection => {
                data = data.map((item, index) => {
                    item._doc.like_status = !!collection[index]
                    return item
                })
                json.data.list = data
                res.json(json)
            }).catch(err => {
                res.json({
                    code: -200,
                    message: err.toString()
                })
            })
        } else {
            data = data.map(item => {
                item._doc.like_status = false
                return item
            })
            json.data.list = data
            res.json(json)
        }
    }).catch(err => {
        res.json({
            code: -200,
            message: err.toString()
        })
    })
}

/**
 * 前台浏览时, 获取单篇文章
 * @method
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */

exports.getItem = (req, res) => {
    var _id = req.query.id,
        user_id = req.cookies.userid
    if (!_id) {
        res.json({
            code: -200,
            message: '参数错误'
        })
    }
    Promise.all([
        Article.findOneAsync({ _id, is_delete: 0 }),
        Like.findOneAsync({ article_id: _id, user_id }),
        Article.updateAsync({ _id }, { '$inc':{ 'visit': 1 } })
    ]).then(value => {
        var json
        if (!value[0]) {
            json = {
                code: -200,
                message: '没有找到该文章'
            }
        } else {
            if (user_id) value[0]._doc.like_status = !! value[1]
            else value[0]._doc.like_status = false
            json = {
                code: 200,
                data: value[0]
            }
        }
        res.json(json)
    }).catch(err => {
        res.json({
            code: -200,
            message: err.toString()
        })
    })
}

exports.getTrending = (req, res) => {
    var limit = 5
    var data = { is_delete: 0 }
    var filds = 'title visit like comment_count'
    Article.find(data, filds).sort('-visit').limit(limit).exec().then(result => {
        var json = {
            code: 200,
            data: {
                list: result
            }
        }
        res.json(json)
    }).catch(err => {
        res.json({
            code: -200,
            message: err.toString()
        })
    })
}



/**
 * 前台浏览时, 获取文章列表
 * @method
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
exports.getList = (req, res) => {
    var by = req.query.by,
        id = req.query.id,
        key = req.query.key,
        limit = req.query.limit,
        page = req.query.page,
        user = req.query.user,
        date = req.query.date,
        user_groups = req.query.user_groups

    page = parseInt(page, 10)
    limit = parseInt(limit, 10)

    var inUser = []

    if (!page) page = 1
    if (!limit) limit = 100
    var data = {
            is_delete: 0
        },
        skip = (page - 1) * limit

    if (date) {
        var reg = new RegExp(date, 'i')
        data.creat_date = {$regex : reg}
    }
    var sort = '-update_date'
    if (by) {
        sort = '-' + by
    }

    var filds = 'title content category category_name visit like comment_count creat_date update_date is_delete timestamp userid username items readtime quality chapters'

    if (user) {
        data.username = user

        Promise.all([
            Article.find(data, filds).sort(sort).skip(skip).limit(limit).exec(),
            Article.countAsync(data)
        ]).then(([data, total]) => {
            var  totalPage = Math.ceil(total / limit),
                data = data.map(item => {
                    item.content = item.content.substring(0, 500)
                    return item
                })
            var json = {
                code: 200,
                data: {
                    list: data,
                    total,
                    hasNext: totalPage > page ? 1 : 0,
                    hasPrev: page > 1
                }
            }
            res.json(json)
        }).catch(err => {
            res.json({
                code: -200,
                message: err.toString()
            })
        })
    }else if(user_groups){
        // console.log(user_groups)
        User.find({user_groups:new RegExp(user_groups,'i'), is_delete:0},'username').exec().then(result =>{
            let usernames=[]
            result.map(r => usernames.push(r.username))
            Promise.all([
                Article.find(data, filds).where('username').in(usernames).sort(sort).skip(skip).limit(limit).exec(),
                Article.countAsync(data)
            ]).then(([data, total]) => {
                var  totalPage = Math.ceil(total / limit),
                    data = data.map(item => {
                        item.content = item.content.substring(0, 500)
                        return item
                    })
                var json = {
                    code: 200,
                    data: {
                        list: data,
                        total,
                        hasNext: totalPage > page ? 1 : 0,
                        hasPrev: page > 1
                    }
                }
                res.json(json)
            }).catch(err => {
                res.json({
                    code: -200,
                    message: err.toString()
                })
            })
        })

    }


}


exports.getSummary = (req, res) => {
    var startDate = req.query.startDate,
        endDate = req.query.endDate,
        type = req.query.type,
        user_groups = req.query.user_groups

    var data = {
        is_delete: 0
    }
    const formatStr='YYYY-MM-DD'
    endDate = moment().format(formatStr)
    if(type === 'day'){
        startDate = moment().format(formatStr)
    }else if(type ==='month' || type==='week'){
        startDate =  moment().startOf(type).format(formatStr)
    }

    var fields = 'creat_date update_date username chapters meditation readtime quality'

    if(user_groups){
        console.log(user_groups)
        User.find({user_groups:new RegExp(user_groups,'i'), is_delete:0},'username').exec().then(result =>{
            let usernames=[]
            result.map(r => usernames.push(r.username))
            Article.find(data, fields).where('creat_date').gte(startDate).lte(endDate).where('username').in(usernames).sort('-update_date').exec()
                .then( data => {
                // console.log(data)
                var groupData = []
                var index = {}
                let offset = 0

                for(let row of data){
                    if(index.hasOwnProperty(row.username)){
                        let curdata = groupData[index[row.username]]
                        curdata.readtime += (row.readtime || 0)
                        curdata.qualitys += ( row.quality || 0)
                        curdata.qualityCnt += row.quality && row.quality>0 ? 1:0
                        curdata.quality = curdata.qualitys / curdata.qualityCnt
                        curdata.meditation += ( row.meditation || 0)
                        curdata.chapters += (row.chapters || 0)
                        curdata.days += 1
                        curdata.late_days += (row.update_date.startsWith(row.creat_date)?0:1)
                    }else{
                        groupData.push({
                            user: row.username,
                            readtime: row.readtime||0,
                            quality: row.quality || 0,
                            qualityCnt: row.quality && row.quality>0 ? 1:0,
                            qualitys: row.quality || 0,
                            update_date: row.update_date,
                            meditation: row.meditation||0,
                            chapters: row.chapters||0,
                            days: 1,
                            late_days: row.update_date.startsWith(row.creat_date)?0:1,
                        })
                        index[row.username] = offset
                        offset ++
                    }
                }

                for(const us of result){
                    let fond = false
                    for(const gd of groupData){
                        if(gd.user === us.username){
                            fond = true
                            break
                        }
                    }
                    if(!fond && us.username !== 'admin'){
                        groupData.push({
                            user: us.username,
                            userid: us._id,
                            readtime: 0,
                            quality: 0,
                            update_date: us.last_update || ('0000-00-00 00:00:00'),
                            meditation: 0,
                            chapters: 0,
                            days: 0,
                            late_days: 0,
                        })
                    }
                }

                // console.log(groupData)

                // console.log(groupData)
                var json = {
                    code: 200,
                    data: groupData
                }
                res.json(json)

            }).catch(err => {
                res.json({
                    code: -200,
                    message: err.toString()
                })
            })
        })

    }

}
