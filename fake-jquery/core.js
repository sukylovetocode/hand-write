/**
 * 如何进行无new实例化
 * 注意：jquery.fn = jquery.prototype 仅仅是用来简化写法的
 * deferred对象就是回调函数解决办法
 * $.when().done().fail() when只能够接受一个deferred对象
 * 使用方法
 * 　var dtd = $.Deferred(); // 新建一个deferred对象

　　var wait = function(dtd){

　　　　var tasks = function(){

　　　　　　alert("执行完毕！");

　　　　　　dtd.resolve(); // 改变deferred对象的执行状态

　　　　};

　　　　setTimeout(tasks,5000);
// 让人们不能在外部改变回调状态
        return dtd.promise(); // 返回promise对象

　　};
// 这样就做到成功回调
$.when(wait(dtd))

　　.done(function(){ alert("哈哈，成功了！"); })

　　.fail(function(){ alert("出错啦！"); });
 */

(function (global) {
  var jquery = function (selector) {
    return new jquery.prototype.init(selector);
  };

  jquery.fn = jquery.prototype = {
    constructor: jquery,
    init: function (selector) {
      console.log("成功诞生");
      this.selector = document.querySelector(selector);
      // 链式调用的秘密
      return this;
    },
    css: function (style) {
      console.log(style);
    },
    each: function (obj, callback) {
      if (Object.prototype.toString.call(obj) === "[object Array]") {
        for (let i = 0; i < obj.length; i++) {
          callback.call(obj[i], i, obj[i]);
        }
      } else {
        for (let i in obj) {
          callback.call(obj[i], i, obj[i]);
        }
      }
      return obj;
    },
  };

  // 扩展办法
  jquery.extend = jquery.fn.extend = function () {
    var target = arguments[0];
    console.log(target);
    let len = arguments.length;
    var i = 1;
    if (len === i) {
      target = this;
      i--;
    }
    // 都赋值给$实例中
    for (; i < length; i++) {
      if ((options = arguments[i]) != null) {
        for (name in options) {
          copy = options[name];
          target[name] = copy;
        }
      }
    }
    return target;
  };

  // 遍历处理方法 each

  // reday文档加载完成后 借助了deferred

  // animation 动画效果

  // input 获取input的值

  // 设置文本text

  // callback对象原理
  // callback 是通过add 添加处理函数队列 通过fire依次执行队列中得函数
  // once 函数队列只能执行一次 unique 函数队列中得函数只能是唯一得
  // stopOnFalse 执行到函数返回值是false的时候 停止执行
  // memory 缓存上一次fire时的参数值，当add()添加回调函数时，直接用上一次的参数值【立刻调用】新加入的回调函数
  jquery.callbacks = function (options) {
    var list = []; // 储存函数
    var queue = []; // 储存数据
    var memory = false; //储存的值
    var locked = (options && options.indexOf("once") !== -1) || false;
    var firingIndex = -1; // 现在执行fire回调的索引

    var fire = function () {
      // 查看有没有值需要现在执行
      // queue有值就循环运行
      // firingIndex 默认的-1
      for (; queue.length; firingIndex = -1) {
        memory = queue.shift(); //储存最后一次得值就可以
        while (++firingIndex < list.length) {
          // Run callback and check for early termination
          list[firingIndex].apply(memory[0], memory[1]);
        }
      }
      // 不存在memory
      if (!options || options.indexOf("memory") === -1) {
        memory = false;
      }
      // 只执行一次就直接清空
      if (locked) {
        list = [];
      }
    };
    var self = {
      // 添加函数
      add: function (func) {
        if (memory) {
          queue.push(memory);
        }
        // 取最后一个函数的索引
        firingIndex = list.length - 1;
        list.push(func);
        if (memory) {
          fire(); // memory有值就要调用
        }
        return this;
      },
      fireWith: function (context, args) {
        args = args || [];
        // 将我们的参数变成数组形式储存
        args = [context, args.slice ? args.slice() : args];
        // [{add:function()..},['func']]
        queue.push(args);
        fire();
        return this;
      },
      // 调用
      fire: function () {
        self.fireWith(this, arguments);
        return this;
      },
    };
    return self;
  };

  // deferred对象 用来回调
  jquery.extend({
    Deferred: function (func) {
      // 这几个参数意义 动作 监听器 回调函数
      // 需要两个回调函数 一个是给当前函数 另一个是给then函数
      var tuples = [
        [
          "notify",
          "progress",
          jQuery.Callbacks("memory"),
          jQuery.Callbacks("memory"),
          2,
        ],
        [
          "resolve",
          "done",
          jQuery.Callbacks("once memory"),
          jQuery.Callbacks("once memory"),
          0,
          "resolved",
        ],
        [
          "reject",
          "fail",
          jQuery.Callbacks("once memory"),
          jQuery.Callbacks("once memory"),
          1,
          "rejected",
        ],
      ];

      var deferrd = {};
      var promise = {
        then: function (onFulfilled, onRejected) {
          // 遵循promise/A+ 标准来写的
          // 添加函数
          return jquery
            .Deferred(function (newDefer) {
              // newDefer表示的
              // 会被运行 需要储存未来需要的onFulfilled, onRejected
              turples[0][3].add(onFulfilled);
              turples[1][3].add(onRejected);
            })
            .promise();
        },
        promise: function (obj) {
          // 等于当前对象
          return obj != null ? jquery.extend(obj, promise) : promise;
        },
      };

      for (let i = 0; i < tuples.length; i++) {
        var list = tuples[i][2]; // list = jquery.callbacks

        // promise.progress = list.add 相当于赋值callbacks
        promise[tuples[i][1]] = list.add;

        // progress_handlers.fire
        // fulfilled_handlers.fire
        // rejected_handlers.fire
        // then的回调方法 储存在了
        list.add(tuples[i][3].fire);

        // 给deferred扩展resolve reject
        // deferred.notify = function() { deferred.notifyWith(...) }
        // deferred.resolve = function() { deferred.resolveWith(...) }
        // deferred.reject = function() { deferred.rejectWith(...) }
        deferred[tuples[i][0]] = function () {
          deferred[tuples[i][0] + "With"](
            this === deferred ? undefined : this,
            arguments
          );
          return this;
        };

        // deferred.notifyWith = list.fireWith
        // deferred.resolveWith = list.fireWith
        // deferred.rejectWith = list.fireWith
        deferred[tuples[i][0] + "With"] = list.fireWith;
      }

      // 合并promise和deferred对象 使得我们deferred对象有了then这些方法
      promise.promise(deferrd);

      // 相当于excutar
      if (func) {
        func.call(deferrd, deferrd);
      }

      return deferrd;
    },
  });

  jquery.extend({
    ajax: function (url, options) {},
  });

  jquery.fn.init.prototype = jquery.fn;

  global.jquery = global.$ = jquery;
})(window);
