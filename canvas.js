let canvas = document.createElement('canvas')
let ctx = canvas.getContext('2d')
canvas.width = window.innerWidth
canvas.height = window.innerHeight
document.body.appendChild(canvas)

function log(msg) {
    console.log(msg)
}
window.requestAnimationFrame(draw);

let time = 0
let id = 1
function newId() {
    return id ++
}
function draw(ms) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    window.requestAnimationFrame(draw);
    if (Shape)
        Shape.render(ms - time)
    time = ms
}

function circle(x, y, r, color) {
    ctx.beginPath()
    ctx.fillStyle = color
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill()
}

function line(sx, sy, ex, ey, color) {
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
}

let Shape = {
    list : {},
    tweens : [],

    addText : function (id, x, y, text) {
        this.list[id] = {
            type : 'text',
            x : x,
            y : y,
            text : text,
            font : 0
        }
    },

    addCircle : function (id, x, y, r, color) {
        this.list[id] = {
            type : 'circle',
            x : x,
            y : y,
            r : r,
            color : color,
        }
    },

    addLine : function (id, sx, sy, ex, ey, color) {
        this.list[id] = {
            type : 'line',
            sx : sx,
            sy : sy,
            ex : ex,
            ey : ey,
            color : color,
        }
    },

    render : function(ms) {
        let tweens = this.tweens[0]
        let keep = []
        for (let id in this.list) {
            let s = this.list[id]
            if (Array.isArray(tweens)) {
                for (let tween of tweens) {
                    if (tween && id == tween.id) {
                        let elapsed = Math.min(tween.time - tween.elapsed, ms)
                        for (let p in tween.props) {
                            if (tween.elapsed == 0) {
                                tween.props[p].start = s[p]
                            }
                            if (typeof s[p] == 'number') {
                                s[p] += (tween.props[p].end - tween.props[p].start) / tween.time * elapsed
                            } else {
                                s[p] = tween.props[p].end
                            }
                        }
                        tween.elapsed += elapsed
                        if (tween.elapsed >= tween.time) {
                            if (tween.onComplete) {
                                tween.onComplete(tween)
                            }
                        } else {
                            if (keep.indexOf(tween) == -1) {
                                keep.push(tween)
                            }
                        }
                    }
                }
            }
            switch (s.type) {
                case 'circle':
                    circle(s.x, s.y, s.r, s.color)
                    break
                case 'line':
                    line(s.sx, s.sy, s.ex, s.ey, s.color)
                    break
                case 'text':
                    ctx.font = Math.floor(s.font) + 'px Arial'
                    ctx.strokeText(s.text, s.x, s.y);
                    break
            }
        }
        if (keep.length > 0) {
            this.tweens[0] = keep
        } else {
            this.tweens.splice(0, 1)
        }
    },

    addTween : function (id, time, props, onComplete = null, onUpdate = null) {
        this.tweens.push([this.initTween(id, time, props, onComplete, onUpdate)])
    },

    initTween : function (id, time, props, onComplete, onUpdate) {
        let shape = this.list[id]
        for (let i in props) {
            props[i] = {end : props[i]}
        }

        return {
            id : id,
            time : time,
            props : props,
            elapsed : 0,
            onComplete : onComplete,
            onUpdate : onUpdate
        }
    },

    addBatchTween : function (tweens) {
        let batch = []
        for (let tween of tweens) {
            batch.push(this.initTween(tween.id, tween.time, tween.props, tween.onComplete, tween.onUpdate))
        }
        this.tweens.push(batch)
    }
}

class TreeNode {
    id = null
    val = null
    left = null
    right = null
    constructor(val) {
        this.id = newId()
        this.val = val
    }
}
let BinarySearchTree = {
    root : null,
    id : 1000,
    gap : 30,
    x : 500,
    y : 50,

    tweenPromise : function (params) {
        return new Promise((resolve, reject) => {
            let id = setInterval (() => {
                if (Shape.tweens.length == 0) {
                    resolve(params)
                    clearTimeout(id)
                }
            }, 20)
        })
    },

    add : function (val) {
        if (!this.root) {
            this.root = new TreeNode(val)
            this.addNode(this.root, 0, 0, 0)
        } else {
            this._add(val, this.root, 1, 0)
        }
        return this.tweenPromise()
    },

    nodeCircle : function (node) {
        return 'circle-' + node.id
    },

    nodeText : function (node) {
        return 'text-' + node.id
    },

    nodeLine : function (node) {
        return 'line-' + node.id
    },

    addNodeLine : function (node) {
        let depth = 0
        let offset = 0
        let start = this.root
        let direction = 0
        while (start) {
            if (node == start) {
                break
            }
            depth ++
            if (node.val < start.val) {
                start = start.left
                offset --
                direction = -1
            } else {
                start = start.right
                offset ++
                direction = 1
            }
        }
        let nodeX = this.x + offset * this.gap
        let nodeY = this.y + depth * this.gap
        let lineOffset = this.gap / Math.sqrt(2)
        if (depth == 0) {
            return null
        }
        return {
            sx : nodeX - direction * lineOffset,
            sy : nodeY - lineOffset,
            ex : nodeX - direction * this.gap + direction * lineOffset,
            ey : nodeY - this.gap + lineOffset
        }
    },

    addNode : function (node, depth, offset, line) {
        let nodeX = this.x + offset * this.gap
        let nodeY = this.y + depth * this.gap
        let lineOffset = this.gap / Math.sqrt(2)
        let circleId = this.nodeCircle(node)
        Shape.addCircle(circleId, nodeX, nodeY, 0, 'red')
        let textId = this.nodeText(node)
        Shape.addText(textId, nodeX - 10, nodeY + 5, node.val)
        let tweens = [
            {id : circleId, time : 111, props : {r : 15}},
            {id : textId, time : 111, props : {font : 15}},
        ]
        if (line) {
            let lineId = this.nodeLine(node)
            let sx = nodeX - line * lineOffset
            let sy = nodeY - lineOffset
            Shape.addLine(lineId, sx, sy, sx, sy, 'black')
            tweens.push(
                {
                    id : lineId,
                    time : 111,
                    props : {
                        ex : nodeX - line * this.gap + line * lineOffset,
                        ey : nodeY - this.gap + lineOffset
                    }
                }
            )
        }
        Shape.addBatchTween(tweens)
    },

    markNode : function (node, color = 'green') {
        Shape.addTween(this.nodeCircle(node), 111, {color : color})
        Shape.addTween(this.nodeCircle(node), 10, {color : 'red'})
    },

    _add : function (val, node, depth, offset) {
        this.markNode(node)
        if (val < node.val) {
            if (!node.left) {
                node.left = new TreeNode(val)
                this.addNode(node.left, depth, offset - 1, -1)
            } else {
                this._add(val, node.left, depth + 1, offset - 1)
            }
        } else {
            if (!node.right) {
                node.right = new TreeNode(val)
                this.addNode(node.right, depth, offset + 1, 1)
            } else {
                this._add(val, node.right, depth + 1, offset + 1)
            }
        }
    },

    search : function (val) {
        return this._search(val, this.root)
    },

    _search : function (val, node) {
        if (!node) {
            return null
        }
        this.markNode(node)
        if (val > node.val) {
            return this._search(val, node.right)
        } else if (val < node.val) {
            return this._search(val, node.left)
        } else {
            return node
        }
    },

    findMax : function (node) {
        if (!node) {
            return null
        }
        this.markNode(node, 'purple')
        if (node.left && node.left.right) {
            return this.findMax(node.left.right)
        } else {
            return node
        }
    },

    findMin : function (node) {
        if (!node) {
            return null
        }
        this.markNode(node, 'blue')
        if (node.right && node.right.left) {
            return this.findMin(node.right.left)
        } else {
            return node
        }
    },

    nodeShapes : function (node) {
        let cId = this.nodeCircle(node)
        let circle = Shape.list[cId]
        let tId = this.nodeText(node)
        let text = Shape.list[tId]
        let lId = this.nodeLine(node)
        let line = Shape.list[lId]
        return JSON.parse(JSON.stringify({line : line ,text : text, circle : circle}))
    },

    moveNodeToNode : function (node1, node2) {
        if (node1 != node2) {
            let c1Id = this.nodeCircle(node1)
            let c2Id = this.nodeCircle(node2)
            let circle2 = Shape.list[c2Id]
            let t1Id = this.nodeText(node1)
            let t2Id = this.nodeText(node2)
            let text = Shape.list[t2Id]
            let l1Id = this.nodeLine(node1)
            delete Shape.list[l1Id]

            let tweens = [
                {id : c1Id, time : 111, props : {x : circle2.x, y : circle2.y}},
                {id : t1Id, time : 111, props : {x : text.x, y : text.y, text : node1.val}}
            ]
            Shape.addBatchTween(tweens)

            let line = this.addNodeLine(node2)
            if (line) {
                Shape.addLine(l1Id, line.sx, line.sy, line.sx, line.sy, 'black')
                Shape.addTween(l1Id, 111, {ex : line.ex, ey : line.ey})
            }
        }
        return this.tweenPromise()
    },

    deleteNode : function (node, newNode) {
        let cId = this.nodeCircle(node)
        delete Shape.list[cId]
        let tId = this.nodeText(node)
        delete Shape.list[tId]
        let lId = this.nodeLine(node)
        delete Shape.list[lId]
        if (newNode && newNode != node) {
            let tId = this.nodeText(newNode)
            Shape.list[tId].text = node.val
            newNode.val = node.val
        }
    },

    deleteFromTree : function (node, val) {
        if (node.left) {
            if (val == node.left.val) {
                node.left = null
            } else if (val < node.left.val) {
                this.deleteFromTree(node.left, val)
            }
        }
        if (node.right) {
            if (val == node.right.val) {
                node.right = null
            } else if (val > node.right.val) {
                this.deleteFromTree(node.right, val)
            }
        }
    },

    updateNode : function (node, newNode) {
        let start = this.root
        while (start) {
            if (node == start) {
                start = newNode
                break
            } else {
                start = node.val < start.val ? start.left : start.right
            }
        }
    },

    nodeParent : function (node, root) {
        if (!root) {
            return null
        }
        if (node.val < root.val) {
            if (node == root.left) {
                return root
            } else {
                return this.nodeParent(node, root.left)
            }
        } else {
            if (node == root.right) {
                return root
            } else {
                return this.nodeParent(node, root.right)
            }
        }
    },

    delete : function (val) {
        let node = this.search(val)
        if (!node) {
            return
        }
        let moveNode = null
        let moveChild = null
        if (node.right) {
            moveNode = this.findMin(node)
            if (moveNode.right) {
                moveChild = moveNode.right
            }
        } else if (node.left) {
            moveNode = this.findMax(node)
            if (moveNode.left) {
                moveChild = moveNode.left
            }
        }
        if (!moveNode) {
            this.deleteNode(node)
            this.root = null
            return
        }
        let nodeParent = this.nodeParent(moveNode, this.root)
        let shapes = this.nodeShapes(moveNode)
        return this.moveNodeToNode(moveNode, node).then(() => {
            this.updateNode(moveNode, null)
            this.deleteNode(moveNode, node)
            return this.tweenPromise()
        }).then(() => {
            if (moveChild) {
                if (shapes.line) {
                    Shape.addTween(
                        this.nodeLine(moveChild),
                        111,
                        {
                            sx : shapes.line.sx,
                            sy : shapes.line.sy,
                            ex : shapes.line.ex,
                            ey : shapes.line.ey
                        }
                    )
                } else {
                    delete Shape.list[this.nodeLine(moveChild)]
                }
                Shape.addTween(this.nodeCircle(moveChild), 111, {x : shapes.circle.x, y : shapes.circle.y})
                Shape.addTween(this.nodeText(moveChild), 111, {x : shapes.text.x, y : shapes.text.y})
                if (nodeParent) {
                    moveChild.val < nodeParent.val ? nodeParent.left = moveChild : nodeParent.right = moveChild
                } else {
                    this.root = moveChild
                    this.root.left = this.root.right = null
                }
                return this.tweenPromise()
            }
        })
    }
}

let div = document.createElement('div')
div.style.position = 'fixed'
div.style.top= '10px'
div.style.width = '210px'
document.body.append(div)
let addBtn = document.createElement('input')
addBtn.type = 'button'
addBtn.value = 'add'
addBtn.onclick = function (e) {
    let number = document.getElementById('addValue').value
    if (!number) {
        number = Math.ceil(Math.random() * 10)
    }
    BinarySearchTree.add(number)
}
let addValue = document.createElement('input')
addValue.setAttribute('id', 'addValue')
addValue.type = 'text'
div.append(addBtn)
div.append(addValue)


let deleteBtn = document.createElement('input')
deleteBtn.type = 'button'
deleteBtn.value = 'delete'
deleteBtn.onclick = function (e) {
    let number = document.getElementById('deleteValue').value
    if (!number) {
        alert('Empty delete value')
        return
    }
    BinarySearchTree.delete(number)
}
let deleteValue = document.createElement('input')
deleteValue.setAttribute('id', 'deleteValue')
deleteValue.type = 'text'
div.append(deleteBtn)
div.append(deleteValue)

BinarySearchTree.add(1).then(
    () => BinarySearchTree.add(11)
).then(
    () => BinarySearchTree.add(10)
).then(
    () => BinarySearchTree.add(15)
).then(
    () => BinarySearchTree.add(13)
).then(
    () => BinarySearchTree.add(14)
)/*.then(
    () => BinarySearchTree.delete(11)
).then(
    () => BinarySearchTree.delete(15)
).then(
    () => BinarySearchTree.delete(1)
).then(
    () => BinarySearchTree.delete(13)
).then(
    () => BinarySearchTree.delete(10)
)
*/
