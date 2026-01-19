# html2canvas 实践踩坑指南

来源: https://juejin.cn/post/6844903513848283143
作者: 丁香园 f2e - 顾重喜

## 1. 需求

最近丁香医生的产品大佬又双叒叕搞事情，想要在 H5 中做一个医生邀请提问的功能，可以将医生的二维码名片分享出去，支持移动、PC 和微信。之前的图片是由后端生成的，并且会缓存三天，导致信息更新不及时。由前端来做就能避免这些问题。

我一听，这好说，不就是个保存图片的功能么，简单看看需求：

- 完善卡片信息，分享出去时候信息更加立体
- 编辑个人资料入口
- 保存图片入口
- 可解决医生名片缓存时间问题
- 长下面这样 ⬇

![image](https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2017/11/24/15fecdcf56afde26~tplv-t2oaga2asx-jj-mark:3024:0:0:0:q75.awebp)

image

分析下来就两点

- html展示实时用户信息
- 点击保存将当前页面保存成图片至本地，并且不包含功能按钮

## 2. 方案

因为之前已经听说过有个库能将 HTML 转为 canvas，然后又听说 canvas 能转为图片，然后又听说图片能下载....(开发基本靠听说（搜索），这是废话)

那我的基本方案就是：
html -> canvas -> image -> a[download]

1. html2canvas.js：可将 htmldom 转为 canvas 元素。[传送门](https://github.com/niklasvh/html2canvas)
2. canvasAPI：toDataUrl() 可将 canvas 转为 base64 格式
3. 创建 a[download] 标签触发 click 事件实现下载

## 3. 采坑表演

既然方案定下来了，下面就开始踩坑表演了，👏

### 3.1. 原理

官方是这样介绍的：

> js将遍历加载页面的 DOM 节点，收集所有元素的信息，然后用这些信息来呈现页面。换句话说，实际上这个库并不是真的对页面进行截图，而是基于从 DOM 读取的元素及属性来一点点的绘制 canvas。 因此，它只能正确地呈现它理解的元素和属性，这意味着有许多 CSS 属性不起作用。

```javascript
// v0.4.1
html2canvas(element, {
  onrendered: function (canvas) {
    // 现在你已经拿到了canvas DOM元素
  },
});

// v0.5.0
html2canvas(element, options).then((canvas) => {
  // 现在你已经拿到了canvas DOM元素
});
```

所以基本可以猜到整个工作流程应该是：

1. 递归处理每个节点，记录这个节点应该怎么画。（比如div就画边框和背景，文字就画文字等等）
2. 考虑节点的层级问题。比如很多布局相关样式属性： z-index、float、position 等的影响。
3. 从低层级开始画到 canvas 上，逐渐向上画。层级高的覆盖层级低的（和浏览器本身的渲染流程很像）。

### 3.2 坑💀

目前官方提供的版本有很多，正式版本是`v0.4.1 - 7.9.2013`，最新版本是`v0.5.0-beta4`，那对于我们开发来说如果不是玩新特性什么的一般还是会选择正式版，结果第一个坑就掉进去爬了半天。

#### 3.2.1 图片模糊

因为开发的时候是用 chrome 模拟器生成 canvas 后没有发现有模糊的地方，但是用 PC 代理手机请求开发资源时,发现画面的模糊感非常明显。

如图：

![image](https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2017/11/24/15fecdcf5686ccab~tplv-t2oaga2asx-jj-mark:3024:0:0:0:q75.awebp)

image

容易想到，可能是移动端像素密度计算的问题。

> 设备像素比 (简称 dpr) 定义了物理像素和设备独立像素的对应关系，它的值可以按如下的公式的得到：

`设备像素比 = 物理像素 / 设备独立像素 // 在某一方向上，x方向或者y方向`

知道了这个也没用，因为文档中根本没有给出能够配置像素比的地方。。

然而通过研究发现，官方文档其实还是 `0.4.1` 的，从 `0.5.0` 版本开始，其实已经偷偷摸摸支持自定义 canvas 作为配置项传入了，它会根据我们传入的 canvas 为基础开始绘制。所以我们在调用 html2canvas 的时候，可以先创建好一个尺寸合适的 canvas，再传进去。

话不多说，首先将库升级到 `0.5.0`，然后：

```javascript
/**
 * 根据window.devicePixelRatio获取像素比
 */
function DPR() {
  if (window.devicePixelRatio && window.devicePixelRatio > 1) {
    return window.devicePixelRatio;
  }
  return 1;
}
/**
 *  将传入值转为整数
 */
function parseValue(value) {
  return parseInt(value, 10);
}
/**
 * 绘制canvas
 */
async function drawCanvas(selector) {
  // 获取想要转换的 DOM 节点
  const dom = document.querySelector(selector);
  const box = window.getComputedStyle(dom);
  // DOM 节点计算后宽高
  const width = parseValue(box.width);
  const height = parseValue(box.height);
  // 获取像素比
  const scaleBy = DPR();
  // 创建自定义 canvas 元素
  const canvas = document.createElement('canvas');

  // 设定 canvas 元素属性宽高为 DOM 节点宽高 * 像素比
  canvas.width = width * scaleBy;
  canvas.height = height * scaleBy;
  // 设定 canvas css宽高为 DOM 节点宽高
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  // 获取画笔
  const context = canvas.getContext('2d');

  // 将所有绘制内容放大像素比倍
  context.scale(scaleBy, scaleBy);

  // 将自定义 canvas 作为配置项传入，开始绘制
  return await html2canvas(dom, { canvas });
}
```

以上代码先获取设备像素比，并根据比例创建尺寸更大的 canvas。如二倍屏就是二倍，三倍屏就是三倍，八倍镜就是八倍···
手机端截图，和html展示效果一致，基本看不出来差别。

![image](https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2017/11/24/15fecdcf5660f7e7~tplv-t2oaga2asx-jj-mark:3024:0:0:0:q75.awebp)

image

#### 3.2.2 图片画出来怎么不见了

PC端截图：

![image](https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2017/11/24/15fecdcf5803550b~tplv-t2oaga2asx-jj-mark:3024:0:0:0:q75.awebp)

image

可能有多种原因，排查后发现是因为 canvas 内的图片跨域了 [这里有解释](https://developer.mozilla.org/zh-CN/docs/Web/HTML/CORS_enabled_image)
总而言之，就是：可以在 canvas 中绘制跨域的图片，但此时的 canvas 处于被 「污染」 的状态，而污染状态的 canvas 使用 toDataUrl() 等 API 是会出现问题的。

所以，现在我们需要做两件事：

1. 给 img 元素设置 `crossOrigin` 属性，值为 `anonymous`
2. 图片服务端设置允许跨域（返回 CORS 头）

第一件事好办，因为 html2canvas 本身支持配置`useCORS: true`；

但是第二件事就要分情况。当图片放在自己服务器时，仅仅是让后端小哥改个配置的事儿。但是当图片放在 CDN 上时······嗯， 为了更快的响应，很多 CDN 会缓存图片的返回值，而缓存的值是不带 CORS 头的。因为没有 CORS 头，所以 js 请求会被拦截。这个时候，我们可以使用服务器转发，在转发时带上 CORS 头。（前端撸一个 node 中间层来进行服务器转发是个很好的方案，这个下回再单独说）

OK。使用以上方案，我们测试一下。

PC 端打开，完美。

微信端，咦，还是不行。
后期发现，使用 html2canvas `0.5.0` 版本是没有问题的，但是开发时使用 `0.4.1` 绘制 canvas 还是会导致图片丢失。猜测是因为 html2canvas 在预载图片和绘制图片时多了什么不可描述的东西。为了解决这个问题，我们使用了一个非常暴力的解决方案：用 js 去获取图片，获得其 base64，放回 img 的 src 中再进行绘制。

```javascript
/**
 * 图片转base64格式
 */
img2base64(url, crossOrigin) {
    return new Promise(resolve => {
        const img = new Image();

        img.onload = () => {
            const c = document.createElement('canvas');

            c.width = img.naturalWidth;
            c.height = img.naturalHeight;

            const cxt = c.getContext('2d');

            cxt.drawImage(img, 0, 0);
            // 得到图片的base64编码数据
            resolve(c.toDataURL('image/png'));
        };

        crossOrigin && img.setAttribute('crossOrigin', crossOrigin);
        img.src = url;
    });
}
```

这个坑总算是磕磕碰碰趟过去了。

#### 3.2.3 倒角

`border-radius` 必须 ≤ 短边长度的一半，并且是具体数值，否则可能会出现奇妙的效果。

另外使用伪元素实现 0.5px 边框也可能会出现奇妙效果，建议直接使用 `border` 属性

`0.4.1` 版本中需要做圆形图片只能置为背景图，img 不支持绘制 border-radius，`0.5.0` 中则无此限制

#### 3.2.4 虚线

前面说的， html2canvas 并不支持所有 css 属性。使用 `border-style: dashed/dotted` 无效，还是大实线。切图在 PC 端有效，但是在微信中，尝试使用切图渲染虚线时有可能还会报 `SecurityError, The operation is insecure.` 错误，导致转 base64 失败

### 3.3 保存

理想：

```javascript
/**
 * 在本地进行文件保存
 * @param  {String} data     要保存到本地的图片数据
 * @param  {String} filename 文件名
 */
saveFile(data, filename) {
    const save_link = document.createElementNS('http://www.w3.org/1999/xhtml', 'a');
    save_link.href = data;
    save_link.download = filename;

    const event = document.createEvent('MouseEvents');
    event.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    save_link.dispatchEvent(event);
}
```

现实：

PC端： 完美。**微信大佬**：不好意思，你说什么？我听不见？！

好嘛，微信中根本没有任何反应。查看 [微信sdk](https://mp.weixin.qq.com/wiki?t=resource/res_main&id=mp1421141115) 后发现：

- `downloadImage` 仅支持 `uploadImage` 接口上传的图片。
- `uploadImage` 接口仅支持 `chooseImage` 接口相册选择的图片。
- `chooseImage` 接口是从本地相册选择图片。
- 那么问题来了，图片都在相册了还需要我们干啥？
- ....

## 4. (在痛苦和妥协中) 交付

最终实现的方案是：

- 用户进入该页面
- 获取当前用户所有信息，头像，二维码等
- 将所有图片转为 base64
- 渲染 `html`
- 绘制 `canvas`
- 将 canvas 保存为 base64
- 替换 `html` 为 `img`，`src`为 base64
- 完成页面到图片的转换，微信中用户可长按页面调起 actionSheet 识别或保存图片

也就是说，用户刚进入页面时，显示的是 html。js 执行完后，将原有 html 删掉，替换为图片。

再回头看我们的需求：

> - html 展示实时用户信息
> - 点击保存将当前页面保存成图片至本地

其实最终只实现了第一点，而第二点其实是实现了一半，图片虽然生成了，但保存功能还是需要用户长按图片，调起微信内置菜单来完成。在进行 H5 开发时，一旦考虑到微信，就有可能出现一些之前考虑不到的问题和限制，对此，产品经理和程序员都要尽可能地多多了解。知道在微信中，能干什么，不能干什么，降低开发和反复沟通的成本。

希望以上内容能够对大家以后的开发有所帮助。
