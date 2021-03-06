# spider
在微服务日趋流行的今天,应用数量是直线上升,同时为了达到高可用、大流量等还会同一应用部署多个实例。这样一来，想要查看分散在各个主机上的日志，就要在不同的主机控制台之间来回切换，并且要记住每个应用及不同实例所在的主机，就没那么愉快了。
打着提升程序员的幸福指数的旗号，Spider出现了。
Spider/ˈspaɪdər/ ，蜘蛛。憧憬它可以像蜘蛛一样，把所有的主机节点织成一张蜘蛛网，我们可以像蜘蛛侠一样，在任意一个结点上可达全部结点。它使用web方式提供全网的日志访问。

# 主要功能
先来个GIF动态图，直观感受下，小心它会循环播放，不要认为你能看到结尾。

![功能图](public/imgs/GIF.gif)

### 控制台
如果是当前浏览的是主节点，进入当前结点的控制台，因为在主机页面进入的是首页。

### 主机
这里会显示整个蜘蛛网上的所有结点，可以点击对应的结点进入控制台。如果带有*主节点*标识，就会进入首页。

### 应用
这里的应用其实就是对应一个目录，不同目录表示不同的应用。如果你知道具体目录并且你愿意，你可以一级一级点进去，否则可以使用搜索功能（这里会优先展示目录，及不包含日期的日志文件，因为我觉得你可能更希望看到最新的日志）。
搜索功能会实时响应你的输入，如果展示出了搜索目标，如果是目录点击进入，或者进入对应的主机控制台通过tail -f 显示对应的文件内容，你可以使用Ctrl+c 结束当前命令，执行任何你想执行并且操作系统支持的命令。这即满足了网络浏览日志的便捷性，又提供了命令行操作的强大功能。
如果你想要下载日志，点击对应的链接即可，在控制台内也可以使用sz命令发送到本地。

# 核心原理
把想要对外提供访问的目录，以只读方式挂载到Docker容器内。一个Docker容器视为蜘蛛网上的一个结点，结点并不与主机完全一一对应，理论上同一台主机上可以运行多个结点，但是没必要。所有结点向主结点推送文件信息（不包含文件内容）；

### 主要技术
- Docker
容器化技术，便于权限管理、资源控制，方便部署。
- Nodejs
轻量，快速。单个节点上内存消耗百兆左右，CPU几乎无消耗。
- WebSocket
全双工长连接。服务端可以随时推送新数据，并且可以分批推送，页面实时展示。避免文件数量过大之后，出现请求时间过长导致页面白屏或者出现错误。

### 为什么要设置主结点
主结点就是蜘蛛所在的结点，也就是我们想要在哪里查看所有的日志。如果当前结点坏了，蜘蛛可以爬到另外一个结点，让其成为主结点。任意结点都可以成为主结点，但是没必要同时成为主结点（理论上支持），因为避免不必要的资源浪费。当然单机版部署也是支持的。页面显示的只是当前结点内的文件信息。有主结点的情况下，所有的结点上也可以查看当前结点内的文件信息。

### 推送时效
使用实时增量，周期全量的方式维护文件信息。
- 实时增量
所有结点新增的日志文件近乎实时可以在前端展示。利用Nodejs的文件监控功能，实时发现文件系统的变动，把新增的文件信息实时推送到主结点，服务端通过websocket技术推送到前端。

- 周期全量
所有结点通过固定的周期频率，将本机上的所有文件信息（如果太多会分批）推送到主结点上。页面会固定周期告诉主结点你该给我推送最新文件信息了。 主结点会记录文件的到达时间，每次向页面推送时会排除到达时间在三个周期以前的文件（毕竟网络不可靠，我给他三次机会如果三个周期内没有再次到达，就认为这个结点离网了）；这样虽然页面有时可能会存在已经离网的文件，但是对日志查看来说并没有多大影响。