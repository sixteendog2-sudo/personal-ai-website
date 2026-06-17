Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$outDir = Join-Path $root "docs/design-assets"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$palette = @{
  bg = [System.Drawing.ColorTranslator]::FromHtml("#F7F9F8")
  card = [System.Drawing.ColorTranslator]::FromHtml("#FFFFFF")
  ink = [System.Drawing.ColorTranslator]::FromHtml("#1F2528")
  muted = [System.Drawing.ColorTranslator]::FromHtml("#6F7D7A")
  line = [System.Drawing.ColorTranslator]::FromHtml("#DDE8E4")
  soft = [System.Drawing.ColorTranslator]::FromHtml("#EDF2F0")
  teal = [System.Drawing.ColorTranslator]::FromHtml("#00A88A")
  tealDark = [System.Drawing.ColorTranslator]::FromHtml("#007D6C")
  tealSoft = [System.Drawing.ColorTranslator]::FromHtml("#E5F8F4")
  coral = [System.Drawing.ColorTranslator]::FromHtml("#FF6B5F")
  cyan = [System.Drawing.ColorTranslator]::FromHtml("#4CB9E7")
  lime = [System.Drawing.ColorTranslator]::FromHtml("#B7E75A")
  yellow = [System.Drawing.ColorTranslator]::FromHtml("#FFC83D")
}

function New-Board($path, $title, $subtitle, [scriptblock]$drawContent) {
  $bmp = New-Object System.Drawing.Bitmap 2400, 1600
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
  $g.Clear($palette.bg)

  $fontTitle = New-Object System.Drawing.Font "Microsoft YaHei UI", 34, ([System.Drawing.FontStyle]::Bold)
  $fontSub = New-Object System.Drawing.Font "Microsoft YaHei UI", 15
  $brushInk = New-Object System.Drawing.SolidBrush $palette.ink
  $brushMuted = New-Object System.Drawing.SolidBrush $palette.muted
  $g.DrawString($title, $fontTitle, $brushInk, 72, 48)
  $g.DrawString($subtitle, $fontSub, $brushMuted, 74, 104)

  & $drawContent $g

  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bmp.Dispose()
}

function RoundedPath([float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $p.AddArc($x, $y, $d, $d, 180, 90)
  $p.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $p.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $p.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $p.CloseFigure()
  return $p
}

function FillRound($g, $x, $y, $w, $h, $r, $color) {
  $path = RoundedPath $x $y $w $h $r
  $brush = New-Object System.Drawing.SolidBrush $color
  $g.FillPath($brush, $path)
  $brush.Dispose()
  $path.Dispose()
}

function StrokeRound($g, $x, $y, $w, $h, $r, $color, $width = 1) {
  $path = RoundedPath $x $y $w $h $r
  $pen = New-Object System.Drawing.Pen $color, $width
  $g.DrawPath($pen, $path)
  $pen.Dispose()
  $path.Dispose()
}

function Text($g, $text, $x, $y, $size = 14, $color = $null, $bold = $false, $maxW = 400) {
  if ($null -eq $color) { $color = $palette.ink }
  $style = if ($bold) { [System.Drawing.FontStyle]::Bold } else { [System.Drawing.FontStyle]::Regular }
  $font = New-Object System.Drawing.Font "Microsoft YaHei UI", $size, $style
  $brush = New-Object System.Drawing.SolidBrush $color
  $rect = New-Object System.Drawing.RectangleF $x, $y, $maxW, 1000
  $fmt = New-Object System.Drawing.StringFormat
  $fmt.Trimming = [System.Drawing.StringTrimming]::EllipsisWord
  $g.DrawString($text, $font, $brush, $rect, $fmt)
  $font.Dispose()
  $brush.Dispose()
  $fmt.Dispose()
}

function Chip($g, $text, $x, $y, $bg, $fg = $null) {
  if ($null -eq $fg) { $fg = $palette.ink }
  FillRound $g $x $y 92 34 17 $bg
  Text $g $text ($x + 18) ($y + 7) 10 $fg $true 80
}

function Button($g, $text, $x, $y, $w = 118, $bg = $null, $fg = $null) {
  if ($null -eq $bg) { $bg = $palette.teal }
  if ($null -eq $fg) { $fg = [System.Drawing.Color]::White }
  FillRound $g $x $y $w 40 10 $bg
  Text $g $text ($x + 18) ($y + 9) 11 $fg $true ($w - 24)
}

function Frame($g, $title, $x, $y, $w, $h, $tag = "") {
  FillRound $g $x $y $w $h 16 $palette.card
  StrokeRound $g $x $y $w $h 16 $palette.line 1
  FillRound $g $x $y $w 54 16 $palette.card
  Text $g $title ($x + 22) ($y + 16) 13 $palette.ink $true 260
  if ($tag -ne "") { Chip $g $tag ($x + $w - 118) ($y + 12) $palette.tealSoft $palette.tealDark }
  $pen = New-Object System.Drawing.Pen $palette.soft, 1
  $g.DrawLine($pen, $x, ($y + 54), ($x + $w), ($y + 54))
  $pen.Dispose()
}

function Photo($g, $x, $y, $w, $h, $c1, $c2) {
  $rect = New-Object System.Drawing.Rectangle $x, $y, $w, $h
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, $c1, $c2, 30
  $path = RoundedPath $x $y $w $h 12
  $g.FillPath($brush, $path)
  $brush.Dispose()
  $path.Dispose()
  $white = [System.Drawing.Color]::FromArgb(80, 255, 255, 255)
  FillRound $g ($x + 18) ($y + 18) 58 20 10 $white
}

function MiniLine($g, $x, $y, $w, $color = $null) {
  if ($null -eq $color) { $color = $palette.soft }
  FillRound $g $x $y $w 8 4 $color
}

function DrawVisitorBoard($g) {
  Frame $g "首页 / 机会入口" 72 168 520 430 "访客"
  Text $g "学习、生活、工作三条主线" 104 246 24 $palette.ink $true 420
  Text $g "成熟但有活力的个人 AI 数字分身，服务升学、社交与求职。" 106 306 13 $palette.muted $false 390
  Button $g "开始咨询" 106 370 126 $palette.teal
  Button $g "查看记录" 246 370 126 $palette.cyan
  Chip $g "升学" 106 436 $palette.tealSoft $palette.tealDark
  Chip $g "社交" 208 436 ([System.Drawing.ColorTranslator]::FromHtml("#FFF0ED")) $palette.coral
  Chip $g "求职" 310 436 ([System.Drawing.ColorTranslator]::FromHtml("#EEF8FD")) $palette.cyan
  Photo $g 410 250 130 180 $palette.teal $palette.lime
  Text $g "最近更新" 106 508 13 $palette.ink $true 200
  MiniLine $g 106 540 170 $palette.tealSoft
  MiniLine $g 106 562 230

  Frame $g "与虚拟的我对话" 632 168 520 430 "AI"
  Text $g "推荐问题" 666 238 13 $palette.ink $true 180
  Chip $g "你是谁" 666 274 $palette.tealSoft $palette.tealDark
  Chip $g "项目经历" 768 274 ([System.Drawing.ColorTranslator]::FromHtml("#EEF8FD")) $palette.cyan
  Chip $g "学习方向" 870 274 ([System.Drawing.ColorTranslator]::FromHtml("#F4FBE4")) $palette.tealDark
  FillRound $g 666 340 360 64 14 $palette.tealSoft
  Text $g "你好，我会基于知识库回答关于学习、生活和工作的真实信息。" 686 354 12 $palette.ink $false 320
  FillRound $g 822 426 278 52 14 ([System.Drawing.ColorTranslator]::FromHtml("#F3F6F5"))
  Text $g "介绍一下你的项目？" 846 440 12 $palette.ink $false 220
  FillRound $g 666 520 420 46 12 $palette.card
  StrokeRound $g 666 520 420 46 12 $palette.line
  Text $g "输入你的问题..." 686 533 11 $palette.muted $false 220
  Button $g "发送" 1000 523 70 $palette.teal

  Frame $g "学习成长 / Study" 1192 168 520 430 "升学"
  Text $g "研究兴趣与学习轨迹" 1224 238 20 $palette.ink $true 360
  MiniLine $g 1226 292 330 $palette.tealSoft
  MiniLine $g 1226 318 250
  Photo $g 1226 362 130 110 $palette.cyan $palette.teal
  Photo $g 1378 362 130 110 $palette.lime $palette.yellow
  Photo $g 1530 362 130 110 $palette.coral $palette.yellow
  Chip $g "课程" 1226 510 $palette.tealSoft $palette.tealDark
  Chip $g "竞赛" 1328 510 ([System.Drawing.ColorTranslator]::FromHtml("#FFF0ED")) $palette.coral
  Chip $g "证书" 1430 510 ([System.Drawing.ColorTranslator]::FromHtml("#F4FBE4")) $palette.tealDark

  Frame $g "工作项目 / Work" 1752 168 576 430 "求职"
  Text $g "项目作品与能力证据" 1784 238 20 $palette.ink $true 360
  for ($i = 0; $i -lt 3; $i++) {
    $yy = 296 + $i * 78
    FillRound $g 1784 $yy 484 56 12 ([System.Drawing.ColorTranslator]::FromHtml("#FAFCFB"))
    StrokeRound $g 1784 $yy 484 56 12 $palette.line
    Text $g ("项目 " + ($i + 1) + "  /  角色、方法、成果") 1804 ($yy + 14) 12 $palette.ink $true 400
    FillRound $g 2190 ($yy + 18) 48 20 10 $palette.tealSoft
  }
  Button $g "查看项目" 1784 538 126 $palette.teal

  Frame $g "生活记录信息流" 72 650 760 780 "生活"
  Text $g "最近记录" 108 718 18 $palette.ink $true 220
  Chip $g "旅行" 238 716 $palette.tealSoft $palette.tealDark
  Chip $g "日常" 340 716 ([System.Drawing.ColorTranslator]::FromHtml("#EEF8FD")) $palette.cyan
  Chip $g "成长" 442 716 ([System.Drawing.ColorTranslator]::FromHtml("#F4FBE4")) $palette.tealDark
  $colors = @(
    @($palette.teal,$palette.cyan), @($palette.coral,$palette.yellow), @($palette.lime,$palette.teal),
    @($palette.cyan,$palette.lime), @($palette.yellow,$palette.coral), @($palette.tealDark,$palette.teal)
  )
  $positions = @(
    @(108,780,206,230), @(336,780,206,310), @(564,780,206,250),
    @(108,1040,206,260), @(336,1120,206,230), @(564,1060,206,300)
  )
  for ($i = 0; $i -lt $positions.Count; $i++) {
    $p = $positions[$i]
    Photo $g $p[0] $p[1] $p[2] ($p[3] - 70) $colors[$i][0] $colors[$i][1]
    Text $g "这一刻想记录下来" ($p[0] + 8) ($p[1] + $p[3] - 58) 11 $palette.ink $true ($p[2] - 16)
    Text $g "时间 · 地点 · 标签" ($p[0] + 8) ($p[1] + $p[3] - 32) 9 $palette.muted $false ($p[2] - 16)
  }

  Frame $g "生活记录详情" 872 650 680 780 "详情"
  Photo $g 910 728 604 300 $palette.teal $palette.cyan
  Text $g "一次值得记住的周末" 912 1060 22 $palette.ink $true 500
  Text $g "这条记录会成为个人知识库的一部分。访客可以围绕它继续提问，AI 会基于真实记录回答。" 914 1108 13 $palette.muted $false 560
  Chip $g "相关记忆" 914 1194 $palette.tealSoft $palette.tealDark
  Chip $g "问问虚拟的我" 1020 1194 ([System.Drawing.ColorTranslator]::FromHtml("#EEF8FD")) $palette.cyan
  MiniLine $g 914 1260 420 $palette.soft
  MiniLine $g 914 1288 340 $palette.soft
  Button $g "开始咨询" 914 1350 126 $palette.teal

  Frame $g "移动端浏览预览" 1592 650 736 780 "Mobile"
  FillRound $g 1654 720 270 620 36 $palette.ink
  FillRound $g 1668 738 242 584 28 $palette.card
  Text $g "生活记录" 1690 768 15 $palette.ink $true 160
  Photo $g 1690 820 198 170 $palette.coral $palette.yellow
  Text $g "今天的灵感" 1692 1008 12 $palette.ink $true 170
  MiniLine $g 1692 1038 160
  Photo $g 1690 1080 198 150 $palette.teal $palette.lime
  Text $g "问问虚拟的我" 1692 1248 11 $palette.tealDark $true 170
  Text $g "联系意图：升学 / 社交 / 求职" 1972 824 18 $palette.ink $true 300
  Text $g "访客进入联系页时可以选择目的，系统记录来源和意图，方便后续沉淀咨询问题。" 1974 874 13 $palette.muted $false 260
  Button $g "联系我" 1974 966 118 $palette.coral
}

function DrawAdminBoard($g) {
  $sidebarX = 72
  $sidebarY = 170
  FillRound $g $sidebarX $sidebarY 250 1260 20 $palette.ink
  Text $g "Admin Console" 104 214 18 ([System.Drawing.Color]::White) $true 200
  $nav = @("后台首页","个人资料","学习档案","工作项目","生活记录","图片素材库","知识库","访客问题","聊天记录","模型设置","提示词配置")
  for ($i = 0; $i -lt $nav.Count; $i++) {
    $yy = 284 + $i * 56
    if ($i -eq 0) { FillRound $g 96 $yy 194 38 10 $palette.teal }
    Text $g $nav[$i] 118 ($yy + 9) 11 ([System.Drawing.Color]::White) ($i -eq 0) 160
  }

  Frame $g "后台首页 / 数据概览" 360 168 600 360 "总览"
  $metricLabels = @("访客问题","知识条目","生活记录","待整理")
  $metricColors = @($palette.cyan,$palette.teal,$palette.lime,$palette.coral)
  for ($i = 0; $i -lt 4; $i++) {
    $x = 394 + $i * 132
    FillRound $g $x 248 112 82 14 ([System.Drawing.ColorTranslator]::FromHtml("#FAFCFB"))
    StrokeRound $g $x 248 112 82 14 $palette.line
    Text $g $metricLabels[$i] ($x + 16) 264 10 $palette.muted $false 90
    Text $g ([string](32 + $i * 18)) ($x + 16) 292 22 $metricColors[$i] $true 80
  }
  Text $g "升学 / 社交 / 求职咨询趋势" 394 370 13 $palette.ink $true 260
  MiniLine $g 394 414 420 $palette.tealSoft
  MiniLine $g 394 446 360

  Frame $g "知识库" 1000 168 610 360 "RAG"
  Text $g "分类、来源、可见性、AI 可用状态" 1034 238 16 $palette.ink $true 420
  for ($i = 0; $i -lt 4; $i++) {
    $yy = 292 + $i * 48
    FillRound $g 1034 $yy 520 34 8 ([System.Drawing.ColorTranslator]::FromHtml("#FAFCFB"))
    Text $g @("学习经历","项目经验","生活记录","访客问题沉淀")[$i] 1050 ($yy + 8) 10 $palette.ink $true 160
    Chip $g @("公开","AI可用","私密","待整理")[$i] 1388 ($yy + 1) @($palette.tealSoft,$palette.tealSoft,([System.Drawing.ColorTranslator]::FromHtml("#FFF0ED")),$palette.lime)[$i] $palette.tealDark
  }
  Button $g "新建知识" 1034 466 126 $palette.teal

  Frame $g "学习档案" 1650 168 678 360 "升学"
  Text $g "课程、研究兴趣、竞赛证书、学习成果" 1684 238 16 $palette.ink $true 480
  Photo $g 1684 300 138 118 $palette.cyan $palette.teal
  Photo $g 1844 300 138 118 $palette.lime $palette.yellow
  Photo $g 2004 300 138 118 $palette.coral $palette.yellow
  Text $g "每条学习内容可单独设置公开展示与 AI 引用。" 1684 454 12 $palette.muted $false 520

  Frame $g "工作项目" 360 570 600 390 "求职"
  for ($i = 0; $i -lt 4; $i++) {
    $yy = 650 + $i * 60
    FillRound $g 394 $yy 520 42 10 ([System.Drawing.ColorTranslator]::FromHtml("#FAFCFB"))
    StrokeRound $g 394 $yy 520 42 10 $palette.line
    Text $g ("项目作品 " + ($i + 1)) 414 ($yy + 10) 11 $palette.ink $true 170
    Text $g "角色 / 技术栈 / 成果" 600 ($yy + 11) 10 $palette.muted $false 200
    FillRound $g 840 ($yy + 11) 44 18 9 $palette.tealSoft
  }
  Button $g "发布项目" 394 900 126 $palette.teal

  Frame $g "生活记录管理" 1000 570 610 390 "生活"
  Photo $g 1034 650 130 120 $palette.teal $palette.cyan
  Photo $g 1188 650 130 160 $palette.coral $palette.yellow
  Photo $g 1342 650 130 132 $palette.lime $palette.teal
  Text $g "公开展示" 1034 840 12 $palette.ink $true 120
  Chip $g "加入知识库" 1136 832 $palette.tealSoft $palette.tealDark
  Chip $g "可用于AI回答" 1260 832 ([System.Drawing.ColorTranslator]::FromHtml("#EEF8FD")) $palette.cyan
  Button $g "发布记录" 1034 900 126 $palette.teal

  Frame $g "访客问题处理" 1650 570 678 390 "沉淀"
  for ($i = 0; $i -lt 4; $i++) {
    $yy = 650 + $i * 58
    FillRound $g 1684 $yy 584 40 10 ([System.Drawing.ColorTranslator]::FromHtml("#FAFCFB"))
    Text $g @("你适合什么研究方向？","介绍一下你的项目经历","平时有什么兴趣？","怎么联系你？")[$i] 1704 ($yy + 10) 10 $palette.ink $false 330
    Chip $g @("待整理","问题转知识","已沉淀","社交")[$i] 2120 ($yy + 3) @(([System.Drawing.ColorTranslator]::FromHtml("#FFF0ED")),$palette.tealSoft,$palette.lime,([System.Drawing.ColorTranslator]::FromHtml("#EEF8FD")))[$i] @($palette.coral,$palette.tealDark,$palette.tealDark,$palette.cyan)[$i]
  }
  Button $g "问题转知识" 1684 900 140 $palette.coral

  Frame $g "聊天记录" 360 1002 600 428 "会话"
  Text $g "完整保存访客问题、AI 回复、引用知识来源和反馈。" 394 1076 13 $palette.muted $false 480
  FillRound $g 394 1146 230 210 14 ([System.Drawing.ColorTranslator]::FromHtml("#FAFCFB"))
  StrokeRound $g 394 1146 230 210 14 $palette.line
  MiniLine $g 422 1188 150 $palette.tealSoft
  MiniLine $g 422 1226 120
  MiniLine $g 422 1264 160
  FillRound $g 652 1146 260 210 14 $palette.tealSoft
  Text $g "引用：项目经验、学习档案、生活记录" 674 1188 12 $palette.ink $false 210

  Frame $g "模型与提示词设置" 1000 1002 610 428 "DeepSeek"
  Text $g "DeepSeek API" 1034 1074 16 $palette.ink $true 240
  MiniLine $g 1034 1128 460
  MiniLine $g 1034 1170 360
  Text $g "场景提示词" 1034 1232 14 $palette.ink $true 180
  Chip $g "升学" 1034 1270 $palette.tealSoft $palette.tealDark
  Chip $g "求职" 1136 1270 ([System.Drawing.ColorTranslator]::FromHtml("#EEF8FD")) $palette.cyan
  Chip $g "社交" 1238 1270 ([System.Drawing.ColorTranslator]::FromHtml("#FFF0ED")) $palette.coral
  Button $g "保存" 1034 1352 94 $palette.teal

  Frame $g "数据隔离与权限" 1650 1002 678 428 "安全"
  Text $g "每条内容都区分公开展示、私密保存、AI 可引用、管理员可见。" 1684 1078 14 $palette.ink $true 560
  $rules = @("owner_id / tenant_id 隔离", "visibility: public / private / unlisted", "is_ai_usable 控制 RAG 召回", "访客匿名会话与管理员数据隔离")
  for ($i = 0; $i -lt $rules.Count; $i++) {
    MiniLine $g 1684 (1144 + $i * 50) 420 @($palette.tealSoft,$palette.soft,$palette.tealSoft,$palette.soft)[$i]
    Text $g $rules[$i] 1702 (1132 + $i * 50) 11 $palette.ink $false 500
  }
}

New-Board (Join-Path $outDir "visitor-ui-board.png") "访客端页面设计归档" "成熟且有活力；围绕学习、生活、工作，服务升学、社交、求职。" ${function:DrawVisitorBoard}
New-Board (Join-Path $outDir "admin-ui-board.png") "管理端页面设计归档" "统一视觉系统；面向知识沉淀、内容维护、AI 配置与数据隔离。" ${function:DrawAdminBoard}

$svgVisitor = @"
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
  <rect width="1600" height="900" fill="#F7F9F8"/>
  <text x="48" y="72" font-family="Microsoft YaHei, Arial" font-size="34" font-weight="700" fill="#1F2528">访客端页面设计归档</text>
  <text x="50" y="112" font-family="Microsoft YaHei, Arial" font-size="18" fill="#6F7D7A">首页 / AI 对话 / 学习成长 / 生活记录 / 工作项目 / 关于我 / 联系我</text>
  <g font-family="Microsoft YaHei, Arial">
    <rect x="60" y="160" width="460" height="260" rx="16" fill="#FFFFFF" stroke="#DDE8E4"/>
    <text x="92" y="220" font-size="28" font-weight="700" fill="#1F2528">学习、生活、工作三条主线</text>
    <text x="94" y="264" font-size="16" fill="#6F7D7A">成熟但有活力的个人 AI 数字分身。</text>
    <rect x="94" y="310" width="120" height="42" rx="10" fill="#00A88A"/><text x="122" y="337" font-size="15" font-weight="700" fill="#fff">开始咨询</text>
    <rect x="232" y="310" width="120" height="42" rx="10" fill="#4CB9E7"/><text x="260" y="337" font-size="15" font-weight="700" fill="#fff">查看记录</text>
    <rect x="560" y="160" width="460" height="260" rx="16" fill="#FFFFFF" stroke="#DDE8E4"/>
    <text x="592" y="218" font-size="24" font-weight="700" fill="#1F2528">与虚拟的我对话</text>
    <rect x="592" y="260" width="340" height="64" rx="14" fill="#E5F8F4"/><text x="616" y="296" font-size="15" fill="#1F2528">基于知识库回答真实问题</text>
    <rect x="1060" y="160" width="460" height="260" rx="16" fill="#FFFFFF" stroke="#DDE8E4"/>
    <text x="1092" y="218" font-size="24" font-weight="700" fill="#1F2528">学习成长 / 工作项目</text>
    <text x="1092" y="262" font-size="16" fill="#6F7D7A">服务升学、求职与合作展示。</text>
    <rect x="60" y="470" width="1460" height="330" rx="16" fill="#FFFFFF" stroke="#DDE8E4"/>
    <text x="92" y="532" font-size="26" font-weight="700" fill="#1F2528">生活记录信息流</text>
    <rect x="92" y="570" width="200" height="170" rx="12" fill="#00A88A"/><rect x="322" y="570" width="200" height="210" rx="12" fill="#FF6B5F"/><rect x="552" y="570" width="200" height="180" rx="12" fill="#B7E75A"/>
    <text x="800" y="620" font-size="20" font-weight="700" fill="#1F2528">照片优先、短文字、标签、时间地点、问问虚拟的我</text>
    <text x="800" y="662" font-size="16" fill="#6F7D7A">生活记录也可进入个人知识库，后续被 AI 检索引用。</text>
  </g>
</svg>
"@

$svgAdmin = @"
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
  <rect width="1600" height="900" fill="#F7F9F8"/>
  <text x="48" y="72" font-family="Microsoft YaHei, Arial" font-size="34" font-weight="700" fill="#1F2528">管理端页面设计归档</text>
  <text x="50" y="112" font-family="Microsoft YaHei, Arial" font-size="18" fill="#6F7D7A">知识库、学习档案、工作项目、生活记录、访客问题、模型与提示词设置</text>
  <g font-family="Microsoft YaHei, Arial">
    <rect x="60" y="160" width="220" height="650" rx="18" fill="#1F2528"/>
    <text x="92" y="214" font-size="21" font-weight="700" fill="#fff">Admin</text>
    <text x="92" y="280" font-size="16" fill="#fff">后台首页</text><text x="92" y="330" font-size="16" fill="#fff">个人资料</text><text x="92" y="380" font-size="16" fill="#fff">学习档案</text><text x="92" y="430" font-size="16" fill="#fff">工作项目</text><text x="92" y="480" font-size="16" fill="#fff">知识库</text><text x="92" y="530" font-size="16" fill="#fff">访客问题</text><text x="92" y="580" font-size="16" fill="#fff">模型设置</text>
    <rect x="320" y="160" width="530" height="260" rx="16" fill="#FFFFFF" stroke="#DDE8E4"/>
    <text x="352" y="222" font-size="25" font-weight="700" fill="#1F2528">后台首页 / 数据概览</text>
    <rect x="354" y="270" width="96" height="72" rx="12" fill="#E5F8F4"/><rect x="474" y="270" width="96" height="72" rx="12" fill="#EEF8FD"/><rect x="594" y="270" width="96" height="72" rx="12" fill="#FFF0ED"/>
    <rect x="890" y="160" width="630" height="260" rx="16" fill="#FFFFFF" stroke="#DDE8E4"/>
    <text x="922" y="222" font-size="25" font-weight="700" fill="#1F2528">知识库 / RAG</text>
    <text x="922" y="268" font-size="16" fill="#6F7D7A">分类、来源、公开状态、AI 可引用状态、向量化状态。</text>
    <rect x="320" y="460" width="370" height="300" rx="16" fill="#FFFFFF" stroke="#DDE8E4"/><text x="352" y="520" font-size="23" font-weight="700" fill="#1F2528">学习档案</text>
    <rect x="720" y="460" width="370" height="300" rx="16" fill="#FFFFFF" stroke="#DDE8E4"/><text x="752" y="520" font-size="23" font-weight="700" fill="#1F2528">工作项目</text>
    <rect x="1120" y="460" width="400" height="300" rx="16" fill="#FFFFFF" stroke="#DDE8E4"/><text x="1152" y="520" font-size="23" font-weight="700" fill="#1F2528">访客问题沉淀</text>
    <text x="1152" y="570" font-size="16" fill="#6F7D7A">待整理 -> 问题转知识 -> 已沉淀</text>
  </g>
</svg>
"@

Set-Content -LiteralPath (Join-Path $outDir "visitor-ui-board.svg") -Value $svgVisitor -Encoding UTF8
Set-Content -LiteralPath (Join-Path $outDir "admin-ui-board.svg") -Value $svgAdmin -Encoding UTF8

Get-ChildItem -LiteralPath $outDir -Filter "*ui-board.*" | Select-Object FullName, Length, LastWriteTime

