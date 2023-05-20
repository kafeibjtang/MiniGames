
window.addEventListener("load", function () {
    //存放小球初始数组
    const bullData = [];
    //获取小球区域
    const gameT = document.querySelector(".game-t");
    //炮台区域
    const gameB = document.querySelector(".game-b");
    //小球尺寸
    const size = 44;
    //游戏区最大宽高
    const maxH = gameT.offsetHeight;
    const maxW = gameT.offsetWidth;
    //最大行  最大列
    const maxRows = ~~(maxH / size);
    const maxSort = ~~(maxW / size);
    //获取炮台
    const arrow = document.querySelector(".arrow");
    //获取子弹
    const bulllet = document.querySelector(".bulllet");
    //获取游戏区
    const gameL = document.querySelector(".game-l");
    //下一次颜色区
    const option = document.querySelector(".option .bulls");
    //开始游戏按钮
    const start = document.querySelector(".start");
    //开始游戏
    const pop = document.querySelector(".pop");
    //结束游戏
    const over = document.querySelector(".over");
    //计分
    const scoring = document.querySelector(".scoring");
    //小球编号
    let idx = 0;
    //分数
    let mark = 0;
    let bullet = {
        color: 'red'
    }
    //游戏开关
    let flag = false;
    spread();
    init();
    initbull();
    function spread() {
        let fragment = document.createDocumentFragment();
        for (let i = 0; i < maxRows; i++) {
            let line = Number(!(i % 2 === 0))
            for (let j = 0; j < maxSort - line; j++) {
                let ele = document.createElement("div");
                ele.classList.add("bull");

                let color = getColor();
                let left = size * (j + (i % 2) / 2);
                let top = i * (size - (i && 6));
                let bull = new Proxy({
                    left,
                    top,
                    color,
                    ele,
                    connect: false,
                    idx,
                    row: i
                }, {
                    set(target, key, val) {
                        if (key === "connect" && val === false) {
                            dropOff(bullData[target.idx].ele);
                        }
                        target[key] = val;
                    },

                })
                fragment.appendChild(ele)
                bullData.push(bull);
                idx++
            }
        }
        gameT.appendChild(fragment);
    }
    //初始化炮台
    function init() {
        setStyle(arrow, {
            top: gameT.offsetHeight - 60 + ["px"],
            left: (gameT.offsetWidth / 2) - (arrow.offsetWidth / 2) + "px",
            zIndex: 2,
        })
    }
    //初始化子弹
    function initbull() {
        let color = getColor();
        bulllet.style.cssText = '';

        bullet.color = color;
        setStyle(bulllet, {
            display: "block",
            backgroundColor: color,
            left: (gameB.offsetWidth / 2) - (size / 2) + "px",
            top: gameT.offsetHeight - 20 + ["px"],
            zIndex: 1,
        })
        option.style.backgroundColor = color;
    }
    //开始游戏按钮
    start.addEventListener("click", function () {
        if (start.innerText == "开始游戏") {
            pop.style.opacity = 1;
            pop.style.zIndex = 1;
            setTimeout(() => {
                pop.style.opacity = 0;
                pop.style.zIndex = -1;
            }, 1000)
            flag = true;
            start.innerText = "结束游戏"
        } else {
            location.replace(location.href);
        }
    })
    //炮台跟随鼠标旋转
    gameT.addEventListener("mousemove", function (e) {
        if (flag) {
            let ex = e.clientX, ey = e.clientY;
            let { top: oy, left: ox } = getPosition(arrow);
            ox += arrow.offsetWidth / 2;
            oy += 56;
            //计算箭头旋转中心与鼠标点的夹角
            let iAngle = Math.abs(Math.atan2(ey - oy, ex - ox) * 180 / Math.PI);//0-180 10-170
            iAngle = Math.min(170, Math.max(10, iAngle));
            iAngle = -iAngle * Math.PI / 180;
            iAngle += Math.PI / 2;
            arrow.style.transform = `rotate(${iAngle * 180 / Math.PI}deg)`;
        }
    })
    //发射子弹
    gameT.addEventListener("mousedown", function () {
        if (flag) {
            let timer;
            let speed = 18;
            let _speedX = speed;
            //发射子弹 子弹发射角度
            let iAngle = Number(arrow.style.transform.match(/rotate\((.+)deg\)/)?.[1]);
            clearInterval(timer);
            timer = setInterval(() => {
                let x = bulllet.offsetLeft, y = bulllet.offsetTop;
                if (x < 0 || x > (gameT.offsetWidth - size)) {
                    _speedX *= -1;
                }
                let collisionBalls = collisionBall({ x, y });
                if (collisionBalls?.length > 0) {
                    let collisionIdx = getShortDistance(collisionBalls);
                    //寻找碰撞到的球的最近的非连接的兄弟球的下标
                    let targetIdx = getFreeSpace(collisionIdx, { x, y });
                    //命中处理
                    hitTarget(targetIdx);
                    clearInterval(timer);
                    return false;
                }


                x += _speedX * Math.cos((iAngle - 90) * Math.PI / 180);
                y += speed * Math.sin((iAngle - 90) * Math.PI / 180);
                bulllet.style.left = x + "px";
                bulllet.style.top = y + "px";

            }, 1000 / 60);
        }
    })


    function collisionBall({ x = 0, y = 0 } = {}) {

        let balls = bullData.filter(item => item.connect);
        balls = getCollisionsDistance(balls, x, y);
        if (balls.length === 0 && y < size / 2) {
            //判断子弹是否碰撞到顶边 既没有碰撞到任何球 y的位置也<22
            let topBall = bullData.slice(0, 10).reduce((acc, curr) => {
                if (Math.abs(acc.left - x) >= Math.abs(curr.left - x)) {
                    acc = curr;
                }
                return acc;
            });
            balls[0] = {
                idx: topBall.idx,
                distance: 0
            }
        }
        return balls;
    }
    function getCollisionsDistance(balls, x, y) {
        return balls.map(item => {
            let _x = item.left - x;
            let _y = item.top - y;
            let distance = Math.sqrt(_x * _x + _y * _y);
            if (distance < size) {
                return {
                    idx: item.idx,
                    distance
                }
            }
            return null;
        }).filter(item => item !== null);
    }
    function getShortDistance(arr = []) {
        if (arr.length === 0) {
            return arr;
        }
        if (arr.length === 1) {
            return arr[0].idx;
        }
        return arr.reduce((acc, curr) => {
            if (acc.distance >= curr.distance) {
                acc = curr;
            }
            return acc;
        }).idx;
    }
    //根据下标寻找兄弟中距离目标最近的空位
    function getFreeSpace(idx, { x = 0, y = 0 } = {}) {
        if (bullData[idx].connect === false) {
            return idx;
        }
        let balls = Object.entries(seek(idx)).map(([key, value]) => value).filter(item => {
            return bullData[item]?.connect === false;
        }).map(item => bullData[item]);

        return getShortDistance(getCollisionsDistance(balls, x, y))
    }
    //命中目标后处理置换球 三色消除 失根消除 重置子弹
    function hitTarget(idx) {
        let target = bullData[idx];
        if (target) {
            placeBall(target, bullet.color);
            let colorBalls = findSeriesNode([idx], true);
            if (colorBalls.length >= 3) {
                //有三个以上相同颜色连通的球
                colorBalls.forEach(item => bullData[item].connect = false);
                let arr = [];
                traceConnect().forEach(item => {
                    arr.push(item)
                    bullData[item].connect = false;
                });
                mark += (colorBalls.length + arr.length);
                scoring.innerText = mark;
            }
            initbull();
        } else {
            flag = false;
            over.style.zIndex = 1;
            over.style.opacity = 1;

        }
    }
    function placeBall(ball, color = '') {
        ball.connect = true;
        ball.color = color || getColor();
        ball.ele.style.cssText = '';
        setStyle(ball.ele, {
            display: "block",
            top: ball.top + 'px',
            left: ball.left + 'px',
            backgroundColor: ball.color
        });
    }
    //递归追踪与中心ball坐标相连通的所有复合条件的兄弟节点
    function findSeriesNode(sameColorSiblings = [], color) {
        let collectArr = sameColorSiblings.slice();
        recu(collectArr);
        function recu(arr) {
            for (let i = 0; i < arr.length; i++) {
                let siblings = getSameTypeSibilings(arr[i], color);
                siblings = siblings.filter(item => (
                    collectArr.indexOf(item) === -1
                ));
                collectArr = collectArr.concat(siblings);
                if (siblings.length > 0) {
                    recu(siblings);
                }
            }
        }
        return collectArr;
    }
    //寻找与中心点相连并且符合条件的兄弟
    function getSameTypeSibilings(idx, color = false) {

        return Object.entries(seek(idx)).map(([key, value]) => value).filter(item => {
            //如果有color参数寻找颜色一样 并且 connect为true的兄弟
            //如果没有color参数 寻找connect为true的兄弟
            if (!bullData[item]) {
                return false;
            }
            let flag = bullData[item].connect === true;
            if (color) {
                return flag && bullData[item].color === bullData[idx].color
            }
            return flag;
        })
    }
    function dropOff(ele) {
        animate({
            ele,
            styleJson: {
                top: ele.offsetTop + 40 + 'px',
                opacity: 0,
                transform: 'scale(.5)'
            },
            callback() {
                ele.style.cssText = '';
                setStyle(ele, {
                    display: 'none'
                })
            }
        })
    }
    //查询所有小球是否链接
    function traceConnect() {
        let lose = [];
        for (let i = 0; i < bullData.length; i++) {
            if (bullData[i].connect) {
                let temp = iteration([i]);
                let res = temp.some(item => item < 10)
                if (!res) {
                    lose.push(i)
                }
            }
        }

        return lose;
    }
    //递归追踪与中心ball坐标相连通的所有复合条件的兄弟节点
    function iteration(sameColor = [], color) {
        let collectArr = sameColor.slice();
        recu(collectArr);
        function recu(arr) {
            for (let i = 0; i < arr.length; i++) {
                let siblings = getSameType(arr[i], color);

                siblings = siblings.filter(item => {
                    return collectArr.indexOf(item) === -1
                });

                collectArr = collectArr.concat(siblings);
                if (siblings.length > 0) {
                    recu(siblings);
                }

            }
        }
        return collectArr;
    }
    //寻找与中心点相连并且颜色相同的兄弟下标数组
    function getSameType(idx, color = false) {
        return Object.entries(seek(idx)).map(([key, val]) => val).filter(item => {
            if (!bullData[item]) { return false }
            let flag = bullData[item].connect === true;
            if (color) {
                return flag && bullData[item].color === bullData[idx].color;
            }
            return flag;


        })
    }
    //传入下标 返回6角方向的兄弟们
    function seek(idx = 0) {
        let { tens, units } = getDigit(idx)
        return getRigthSolt(idx, {
            tl: (tens - 1) * 10 + (units - 0),
            tr: (tens - 1) * 10 + (units + 1),
            ml: (tens - 0) * 10 + (units - 1),
            mr: (tens - 0) * 10 + (units + 1),
            bl: (tens + 1) * 10 + (units - 1),
            br: (tens + 1) * 10 + (units - 0),
        })
    }
    //重置六个兄弟ball中错误行或不存在的项下标为null
    function getRigthSolt(idx = 0, { tl, tr, ml, mr, bl, br } = {}) {
        const diffRow = {
            t: -1,
            m: 0,
            b: 1
        }
        let row = bullData[idx].row;
        return Object.entries({ tl, tr, ml, mr, bl, br }).reduce((acc, [key, val]) => {
            acc[key] = (bullData[val] && isRightSolt(bullData[val].row, row, diffRow[key[0]])) ? val : null;
            return acc
        }, {})
    }
    //拆分一个数的十位与各位
    function getDigit(num) {
        return {
            tens: ~~(num / 10),
            units: ~~(num % 10)
        }
    }

    //判断某个兄弟ball 的行号是否正确 放置边角错行
    function isRightSolt(sRow, row, padNum) {
        return (row + padNum) === sRow;
    }

    //设置元素样式
    function setStyle(dom, css) {
        for (var key in css) {
            dom['style'][key] = css[key];
        }
    }


    //随机颜色
    function getColor() {
        const colors = ['#f25a5a', '#eccf64', '#b68eb1', '#6697ca', '#7dc6d7', '#80c29c'];

        return colors[~~(Math.random() * colors.length)]
    }

    //动画函数
    function animate({ ele, styleJson = {}, time = 300, speed = 'linear', callback } = {}) {
        ele.style.transition = `${time}ms ${speed}`;
        setStyle(ele, styleJson);
        ele.addEventListener('transitionend', end, false);
        function end() {
            callback && callback();
            ele.removeEventListener('transitionend', end);
            ele.style.transition = '';
        }
    }
    function getPosition(element) {
        var pos = {
            left: 0,
            top: 0
        }
        while (element.offsetParent) {
            pos.left += element.offsetLeft;
            pos.top += element.offsetTop;
            element = element.offsetParent;
        }
        return pos;
    }
})