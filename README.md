## 客户端目录 front_end
---
```
┌─build										// webpack配置文件   
│      build.js   
│      check-versions.js  
│      logo.png  
│      utils.js  
│      vue-loader.conf.js  
│      webpack.base.conf.js  
│      webpack.dev.conf.js  
│      webpack.prod.conf.js  
│      
├─config									// vue配置文件  
│      dev.env.js  
│      index.js  
│      prod.env.js  
│      test.env.js  
│      
├─src  
│  │  App.vue								// 根组件  
│  │  main.js  
│  │    
│  ├─assets									// 静态资源  
│  │  │  logo.png  
│  │  │    
│  │  └─style								// 样式文件  
│  │          reset.css  
│  │          
│  ├─components								// 组件目录  
│  ├─pages									// 页面目录  
│  │      index.vue							// 主页面（核心代码）  
│  │      
│  ├─resource								// 资源目录   
│  │      bill.csv  
│  │      categories.csv  
│  │      
│  ├─router									// 路由配置  
│  │      index.js
│  │      
│  └─utils									// 公用函数目录  
│          format.js						// 一些format方法  
│          
└─static  
        .gitkeep  
```

## 服务端目录 server
---
```
│  index.js									// 服务端脚本  
│  package.json  
│  
└─router  
        router.js							// 路由配置  
``` 
## 运行环境
---
操作系统：Windows
运行环境：node
需要工具：MongoDB(v3.2以上)

## 如何运行
---
安装，导入数据，运行后台，安装依赖，运行前端  
1.安装MongoDB、nodejs  
2.命令行运行 mongoimport --type csv --headerline --db xmind --file “文件路径/文件名.csv” 命令分别导入bill和categories两个csv文件数据  
3.在服务端执行 npm install 安装依赖，完成后执行 node index.js 运行  
4.在客户端执行 npm install 安装依赖, 完成后执行 node run dev 运行  
5.在 http://localhost:8080 查看项目  
  
## 项目思路
1.首先想的是怎么处理csv文件，一开始想直接用axios读取文件数据，但是这样获取的是字符串，每次查询数据都要对字符串进行处理效率太低，而且随着数据量增加，可能有溢出的情况，后来还是选择使用mongoDB来储存数据  
2.在组件库上选择了熟悉的element-ui，然后构思页面的结构，搭个大概  
3.开始搭建express服务器，使用了express的route来处理前端的请求，对数据库进行操作。这个过程对我来说是整个项目的难点，因为没用nodejs操作过数据库，都是看着文档去找API和操作，用得最多的就是aggregate了  
4.拿到后台数据后，就是渲染到前端了，这个过程没什么意外  