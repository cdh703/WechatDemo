import { common } from '@kit.AbilityKit';
import { window } from '@kit.ArkUI';
import { vibrator } from '@kit.SensorServiceKit';

const BLUE: ResourceColor = '#0A59F7';
const PAGE_BG: ResourceColor = '#F3F6FC';
const PANEL_BG: ResourceColor = '#DDF8FAFD';
const KEY_BG: ResourceColor = '#FFFFFF';

PersistentStorage.persistProp('calculatorHistory', new Array<string>());

class ExpressionParser {
  private source: string = '';
  private index: number = 0;
  private degreeMode: boolean = true;

  evaluate(source: string, degreeMode: boolean): number {
    this.source = source.replace(/×/g, '*').replace(/÷/g, '/').replace(/π/g, 'pi');
    this.index = 0;
    this.degreeMode = degreeMode;
    const value = this.parseAddSubtract();
    this.skipSpaces();
    if (this.index !== this.source.length || !Number.isFinite(value)) throw new Error('Invalid expression');
    return value;
  }

  private skipSpaces(): void {
    while (this.index < this.source.length && this.source[this.index] === ' ') this.index++;
  }

  private match(token: string): boolean {
    this.skipSpaces();
    if (this.source.substring(this.index, this.index + token.length) === token) {
      this.index += token.length;
      return true;
    }
    return false;
  }

  private parseAddSubtract(): number {
    let value = this.parseMultiplyDivide();
    while (true) {
      if (this.match('+')) value += this.parseMultiplyDivide();
      else if (this.match('-')) value -= this.parseMultiplyDivide();
      else return value;
    }
  }

  private parseMultiplyDivide(): number {
    let value = this.parsePower();
    while (true) {
      if (this.match('*')) value *= this.parsePower();
      else if (this.match('/')) {
        const divisor = this.parsePower();
        if (divisor === 0) throw new Error('Division by zero');
        value /= divisor;
      } else return value;
    }
  }

  private parsePower(): number {
    let value = this.parseUnary();
    if (this.match('root')) {
      const degree = this.parsePower();
      if (degree === 0) throw new Error('Invalid root');
      value = Math.pow(value, 1 / degree);
    } else if (this.match('^')) value = Math.pow(value, this.parsePower());
    return value;
  }

  private parseUnary(): number {
    if (this.match('+')) return this.parseUnary();
    if (this.match('-')) return -this.parseUnary();
    const functions: string[] = ['asin', 'acos', 'atan', 'sqrt', 'sin', 'cos', 'tan', 'log', 'ln'];
    for (let i = 0; i < functions.length; i++) {
      const name = functions[i];
      if (this.match(name)) {
        if (!this.match('(')) throw new Error('Missing parenthesis');
        const input = this.parseAddSubtract();
        if (!this.match(')')) throw new Error('Missing parenthesis');
        return this.applyFunction(name, input);
      }
    }
    return this.parsePostfix();
  }

  private parsePostfix(): number {
    let value = this.parsePrimary();
    while (this.match('!')) value = this.factorial(value);
    return value;
  }

  private parsePrimary(): number {
    if (this.match('(')) {
      const value = this.parseAddSubtract();
      if (!this.match(')')) throw new Error('Missing parenthesis');
      return value;
    }
    if (this.match('pi')) return Math.PI;
    if (this.match('e')) return Math.E;
    this.skipSpaces();
    const start = this.index;
    let hasDot = false;
    while (this.index < this.source.length) {
      const char = this.source[this.index];
      if (char >= '0' && char <= '9') this.index++;
      else if (char === '.' && !hasDot) { hasDot = true; this.index++; }
      else break;
    }
    if (start === this.index) throw new Error('Number expected');
    if (this.index < this.source.length && (this.source[this.index] === 'e' || this.source[this.index] === 'E')) {
      const exponentStart = this.index;
      this.index++;
      if (this.index < this.source.length && (this.source[this.index] === '+' || this.source[this.index] === '-')) this.index++;
      const exponentDigits = this.index;
      while (this.index < this.source.length && this.source[this.index] >= '0' && this.source[this.index] <= '9') this.index++;
      if (exponentDigits === this.index) this.index = exponentStart;
    }
    return Number(this.source.substring(start, this.index));
  }

  private applyFunction(name: string, value: number): number {
    if (name === 'sqrt') {
      if (value < 0) throw new Error('Invalid square root');
      return Math.sqrt(value);
    }
    if (name === 'ln') return Math.log(value);
    if (name === 'log') return Math.log(value) / Math.LN10;
    if (name === 'asin' || name === 'acos' || name === 'atan') {
      let angle = 0;
      if (name === 'asin') angle = Math.asin(value);
      if (name === 'acos') angle = Math.acos(value);
      if (name === 'atan') angle = Math.atan(value);
      return this.degreeMode ? angle * 180 / Math.PI : angle;
    }
    const radians = this.degreeMode ? value * Math.PI / 180 : value;
    if (name === 'sin') return Math.sin(radians);
    if (name === 'cos') return Math.cos(radians);
    return Math.tan(radians);
  }

  private factorial(value: number): number {
    if (value < 0 || Math.floor(value) !== value || value > 170) throw new Error('Invalid factorial');
    let answer = 1;
    for (let i = 2; i <= value; i++) answer *= i;
    return answer;
  }
}

@Entry
@Component
struct Index {
  @State expression: string = '';
  @State answer: string = '0';
  @State menuVisible: boolean = false;
  @State historyVisible: boolean = false;
  @State scientific: boolean = false;
  @State inverse: boolean = false;
  @State degreeMode: boolean = true;
  @State memory: number = 0;
  @State isWide: boolean = false;
  @State pageWidth: number = 360;
  @StorageLink('calculatorHistory') history: string[] = [];
  @State historyPage: boolean = false;
  @State swipeIndex: number = -1;
  @State swipeOffset: number = 0;
  @State introVisible: boolean = true;
  @State introStage: number = 0;
  @State introSpin: number = 0;
  @State digitLift: number = 0;
  @State digitScale: number = 1;
  @State buttonsAssembled: boolean = false;
  @State interfaceX: number = 0;
  @State bootHintVisible: boolean = false;
  @State introScale: number = 0.2;
  @State symbolReveal: number = 0;
  @State introFlash: number = 0;
  private parser: ExpressionParser = new ExpressionParser();
  @State justEvaluated: boolean = false;

  aboutToAppear(): void {
    setTimeout(() => {
      this.introStage = 1;
      this.getUIContext().animateTo({ duration: 780, curve: Curve.EaseOut }, () => {
        this.introScale = 1;
        this.symbolReveal = 1;
        this.introSpin = 400;
      });
    }, 450);
    setTimeout(() => {
      this.introStage = 2;
      this.softVibrate(12);
      this.getUIContext().animateTo({ duration: 620, curve: Curve.EaseInOut }, () => {
        this.digitLift = -260;
        this.digitScale = 0.02;
        this.introSpin = 760;
        this.introScale = 1.18;
      });
    }, 1200);
    setTimeout(() => {
      this.introStage = 3;
      this.introFlash = 1;
      this.softVibrate(16);
      this.getUIContext().animateTo({ duration: 300, curve: Curve.EaseOut }, () => { this.introFlash = 0; });
    }, 1950);
    setTimeout(() => { this.introStage = 4; }, 2500);
    setTimeout(() => { this.introStage = 5; }, 3000);
    setTimeout(() => {
      this.introStage = 6;
      this.softVibrate(18);
      this.getUIContext().animateTo({ duration: 820, curve: Curve.Friction }, () => { this.buttonsAssembled = true; });
    }, 3500);
    setTimeout(() => {
      this.introVisible = false;
      this.bootHintVisible = true;
      this.softVibrate(25);
      this.getUIContext().animateTo({ duration: 70, curve: Curve.Linear }, () => { this.interfaceX = 4; });
      setTimeout(() => { this.getUIContext().animateTo({ duration: 70 }, () => { this.interfaceX = -4; }); }, 70);
      setTimeout(() => { this.getUIContext().animateTo({ duration: 90 }, () => { this.interfaceX = 0; }); }, 140);
    }, 4300);
    setTimeout(() => { this.getUIContext().animateTo({ duration: 260 }, () => { this.bootHintVisible = false; }); }, 4650);
  }

  private softVibrate(duration: number): void {
    try {
      vibrator.startVibration({ type: 'time', duration: duration }, { usage: 'touch' }).catch(() => {});
    } catch (_) {}
  }

  private entranceX(label: string): number {
    if (this.buttonsAssembled) return 0;
    if ('789'.indexOf(label) >= 0) return -520;
    if ('456'.indexOf(label) >= 0) return 520;
    if (label === '0') return 0;
    if ('÷×−+'.indexOf(label) >= 0) return label === '÷' || label === '−' ? -380 : 380;
    return 0;
  }

  private entranceY(label: string): number {
    if (this.buttonsAssembled) return 0;
    if ('123'.indexOf(label) >= 0) return -620;
    if (label === '0' || label === '%' || label === '.') return 620;
    if ('÷×−+'.indexOf(label) >= 0) return -260;
    return 420;
  }

  private entranceAngle(label: string): number {
    if (this.buttonsAssembled) return 0;
    return '÷×−+'.indexOf(label) >= 0 ? 540 : 22;
  }

  private shownExpression(): string {
    if (this.expression.length === 0) return '';
    return this.expression.replace(/\*/g, '×').replace(/\//g, '÷').replace(/pi/g, 'π')
      .replace(/sqrt/g, '√').replace(/root/g, 'ʸ√');
  }

  private formatNumber(value: number): string {
    if (!Number.isFinite(value)) return '错误';
    if (Math.abs(value) < 1e-14) value = 0;
    const absolute = Math.abs(value);
    if ((absolute !== 0 && absolute < 1e-9) || absolute >= 1e12) {
      return value.toExponential(10).replace(/\.0+e/, 'e').replace(/(\.\d*?)0+e/, '$1e');
    }
    return Number(value.toPrecision(12)).toString();
  }

  private calculateCurrent(): number {
    return this.parser.evaluate(this.expression.length > 0 ? this.expression : this.answer, this.degreeMode);
  }

  private inputDigit(value: string): void {
    if (this.justEvaluated || this.answer === '错误') {
      this.expression = '';
      this.answer = '0';
      this.justEvaluated = false;
    }
    if (value === '.') {
      let tail = '';
      for (let i = this.expression.length - 1; i >= 0; i--) {
        const char = this.expression[i];
        if ((char >= '0' && char <= '9') || char === '.') tail = char + tail;
        else break;
      }
      if (tail.indexOf('.') >= 0) return;
      if (tail.length === 0) this.expression += '0';
    }
    if (this.expression.length > 0) {
      const last = this.expression[this.expression.length - 1];
      if (last === ')' || last === 'i' || last === 'e') this.expression += '*';
    }
    this.expression += value;
    this.preview();
  }

  private inputOperator(value: string): void {
    this.menuVisible = false;
    if (this.justEvaluated) { this.expression = this.answer; this.justEvaluated = false; }
    if (this.expression.length === 0) this.expression = this.answer;
    const last = this.expression[this.expression.length - 1];
    if ('+-*/^'.indexOf(last) >= 0) this.expression = this.expression.substring(0, this.expression.length - 1) + value;
    else this.expression += value;
  }

  private inputToken(value: string): void {
    if (this.justEvaluated || this.answer === '错误') { this.expression = ''; this.justEvaluated = false; }
    if (this.expression.length > 0 && value !== ')') {
      const last = this.expression[this.expression.length - 1];
      const isValue = (last >= '0' && last <= '9') || last === ')' || last === 'i' || last === 'e';
      if (isValue) this.expression += '*';
    }
    this.expression += value;
    this.preview();
  }

  private preview(): void {
    try {
      this.answer = this.formatNumber(this.calculateCurrent());
    } catch (_) {
      // 输入中的不完整表达式继续保留上一次可计算的预览结果。
    }
  }

  private equals(): void {
    if (this.expression.length === 0) return;
    try {
      const original = this.shownExpression();
      this.answer = this.formatNumber(this.calculateCurrent());
      this.history = [`${original} = ${this.answer}`].concat(this.history).slice(0, 20);
      this.justEvaluated = true;
    } catch (_) { this.answer = '错误'; this.justEvaluated = true; }
  }

  private clear(): void { this.expression = ''; this.answer = '0'; this.justEvaluated = false; }

  private backspace(): void {
    if (this.justEvaluated || this.answer === '错误') { this.clear(); return; }
    if (this.expression.length > 0) {
      this.expression = this.expression.substring(0, this.expression.length - 1);
      if (this.expression.length === 0) this.answer = '0';
      else this.preview();
    }
  }

  private applyUnary(name: string): void {
    try {
      const value = this.calculateCurrent();
      let output = value;
      if (name === 'square') output = value * value;
      else if (name === 'cube') output = value * value * value;
      else if (name === 'reciprocal') { if (value === 0) throw new Error('Division by zero'); output = 1 / value; }
      else if (name === 'percent') output = value / 100;
      else if (name === 'factorial') output = this.parser.evaluate(`${value}!`, this.degreeMode);
      else output = this.parser.evaluate(`${name}(${value})`, this.degreeMode);
      const oldText = this.expression.length > 0 ? this.shownExpression() : this.answer;
      this.answer = this.formatNumber(output);
      this.expression = this.answer;
      this.history = [`${name}(${oldText}) = ${this.answer}`].concat(this.history).slice(0, 20);
      this.justEvaluated = true;
    } catch (_) { this.answer = '错误'; this.justEvaluated = true; }
  }

  private memoryChange(mode: string): void {
    if (mode === 'clear') { this.memory = 0; return; }
    if (mode === 'recall') {
      const value = this.formatNumber(this.memory);
      if (this.justEvaluated) this.expression = '';
      this.expression += value; this.answer = value; this.justEvaluated = false; return;
    }
    try { const current = this.calculateCurrent(); this.memory += mode === 'add' ? current : -current; }
    catch (_) { this.answer = '错误'; }
  }

  private setScientificMode(enabled: boolean): void {
    this.scientific = enabled;
    this.menuVisible = false;
    const context = this.getUIContext().getHostContext() as common.UIAbilityContext;
    window.getLastWindow(context).then((mainWindow: window.Window) => {
      mainWindow.setPreferredOrientation(enabled ? window.Orientation.AUTO_ROTATION_LANDSCAPE :
        window.Orientation.AUTO_ROTATION_PORTRAIT);
    }).catch(() => {});
  }

  private removeHistory(index: number): void {
    this.history = this.history.slice(0, index).concat(this.history.slice(index + 1));
    this.swipeIndex = -1;
    this.swipeOffset = 0;
  }

  private clearAllHistory(): void {
    this.history = [];
    this.clear();
  }

  private historyExpression(item: string): string {
    const place = item.lastIndexOf(' = ');
    return place >= 0 ? item.substring(0, place) : item;
  }

  private historyResult(item: string): string {
    const place = item.lastIndexOf(' = ');
    return place >= 0 ? item.substring(place + 3) : '';
  }

  private catSticker(label: string): Resource {
    if (label === 'C') return $r('app.media.cat_00');
    if (label === '÷') return $r('app.media.cat_01');
    if (label === '×') return $r('app.media.cat_02');
    if (label === '⌫') return $r('app.media.cat_03');
    if (label === '7') return $r('app.media.cat_04');
    if (label === '8') return $r('app.media.cat_05');
    if (label === '9') return $r('app.media.cat_06');
    if (label === '−') return $r('app.media.cat_07');
    if (label === '4') return $r('app.media.cat_08');
    if (label === '5') return $r('app.media.cat_09');
    if (label === '6') return $r('app.media.cat_10');
    if (label === '+') return $r('app.media.cat_11');
    if (label === '1') return $r('app.media.cat_12');
    if (label === '2') return $r('app.media.cat_13');
    if (label === '3') return $r('app.media.cat_14');
    if (label === '%') return $r('app.media.cat_16');
    if (label === '0') return $r('app.media.cat_17');
    if (label === '.') return $r('app.media.cat_18');
    if (label === '(') return $r('app.media.cat_09');
    if (label === ')') return $r('app.media.cat_03');
    if (label === '1/x') return $r('app.media.cat_17');
    if (label === 'x²') return $r('app.media.cat_13');
    if (label === 'x³') return $r('app.media.cat_10');
    if (label === 'xʸ') return $r('app.media.cat_08');
    if (label === 'x!') return $r('app.media.cat_00');
    if (label === '√') return $r('app.media.cat_12');
    if (label === 'ʸ√x') return $r('app.media.cat_06');
    if (label === 'e') return $r('app.media.cat_03');
    if (label === 'ln') return $r('app.media.cat_17');
    if (label === 'log') return $r('app.media.cat_10');
    if (label === 'sin') return $r('app.media.cat_02');
    if (label === 'cos') return $r('app.media.cat_09');
    if (label === 'tan') return $r('app.media.cat_16');
    if (label === 'Inv') return $r('app.media.cat_00');
    if (label === 'Deg' || label === 'Rad') return $r('app.media.cat_13');
    if (label === 'π') return $r('app.media.cat_11');
    if (label === 'MC') return $r('app.media.cat_00');
    if (label === 'M+') return $r('app.media.cat_02');
    if (label === 'M−') return $r('app.media.cat_09');
    if (label === 'MR') return $r('app.media.cat_13');
    return $r('app.media.cat_15');
  }

  @Builder
  private CalcButton(label: string, action: () => void, accent: boolean = false, selected: boolean = false) {
    Button() {
      if (this.isWide) {
        Row() {
          Text(label).fontSize(16).fontWeight(accent ? FontWeight.Medium : FontWeight.Normal)
            .fontColor(accent ? BLUE : '#161616').width('68%').textAlign(TextAlign.Center)
          Image(this.catSticker(label)).width('32%').height('82%').objectFit(ImageFit.Contain)
            .opacity(0.96)
        }.width('100%').height('100%')
      } else {
        Stack({ alignContent: Alignment.Center }) {
          Image(this.catSticker(label)).width('91%').height('91%').objectFit(ImageFit.Contain).opacity(0.96)
          Text(label).fontSize(28).fontWeight(accent ? FontWeight.Medium : FontWeight.Normal)
            .fontColor(label === '×' ? '#F06B75' : (accent ? BLUE : '#161616')).zIndex(2)
        }.width('100%').height('100%')
      }
    }
      .backgroundColor(selected ? '#DCE8FF' : KEY_BG)
      .borderRadius(50).width('100%').height('100%').shadow({ radius: 8, color: '#18000000', offsetY: 3 })
      .translate({ x: this.entranceX(label), y: this.entranceY(label) })
      .rotate({ angle: this.entranceAngle(label) })
      .scale({ x: this.buttonsAssembled ? 1 : 0.72, y: this.buttonsAssembled ? 1 : 0.72 })
      .opacity(this.buttonsAssembled ? 1 : 0)
      .animation({ duration: 650, curve: Curve.Friction })
      .onClick(action)
  }

  @Builder
  private TrashIcon(iconColor: ResourceColor = '#171717') {
    Column({ space: 2 }) {
      Row() {
        Blank().width(9).height(2).borderRadius(1).backgroundColor(iconColor)
      }.width(24).height(4).justifyContent(FlexAlign.Center)
      Blank().width(25).height(3).borderRadius(2).backgroundColor(iconColor)
      Row({ space: 4 }) {
        Blank().width(2).height(13).borderRadius(1).backgroundColor(iconColor)
        Blank().width(2).height(13).borderRadius(1).backgroundColor(iconColor)
        Blank().width(2).height(13).borderRadius(1).backgroundColor(iconColor)
      }
      .width(20).height(21).justifyContent(FlexAlign.Center)
      .border({ width: 2, color: iconColor }).borderRadius({ bottomLeft: 4, bottomRight: 4 })
    }.width(30).height(32).alignItems(HorizontalAlign.Center).justifyContent(FlexAlign.Center)
  }

  @Builder
  private HistoryIcon(iconColor: ResourceColor = '#171717') {
    Stack({ alignContent: Alignment.Center }) {
      Row().width(23).height(23).border({ width: 2, color: iconColor }).borderRadius(12)
      Row().width(2).height(8).borderRadius(1).backgroundColor(iconColor)
        .position({ x: 10.5, y: 3.5 })
      Row().width(7).height(2).borderRadius(1).backgroundColor(iconColor)
        .position({ x: 10.5, y: 10.5 })
    }.width(28).height(28)
  }

  @Builder
  private KeyCell(label: string, action: () => void, accent: boolean = false, selected: boolean = false) {
    Row() { this.CalcButton(label, action, accent, selected) }
      .layoutWeight(1).height('100%')
      .padding({ left: this.isWide ? 10 : 5, right: this.isWide ? 10 : 5 })
  }

  @Builder
  private FourDots() {
    Button() {
      Column({ space: 5 }) {
        Row({ space: 10 }) { Text('').width(5).height(5).borderRadius(3).backgroundColor('#171717'); Text('').width(5).height(5).borderRadius(3).backgroundColor('#171717') }
        Row({ space: 10 }) { Text('').width(5).height(5).borderRadius(3).backgroundColor('#171717'); Text('').width(5).height(5).borderRadius(3).backgroundColor('#171717') }
      }
    }
    .width(this.isWide ? 40 : 52).height(this.isWide ? 40 : 52).borderRadius(30).backgroundColor(KEY_BG)
    .shadow({ radius: 9, color: '#20000000', offsetY: 3 })
    .onClick(() => { this.menuVisible = !this.menuVisible; this.historyVisible = false; })
  }

  @Builder
  private Header() {
    Row() {
      Button() { this.HistoryIcon() }
        .width(this.isWide ? 40 : 52).height(this.isWide ? 40 : 52).borderRadius(30)
        .backgroundColor(KEY_BG).shadow({ radius: 9, color: '#20000000', offsetY: 3 })
        .onClick(() => { this.historyPage = true; this.menuVisible = false; })
      Blank()
      this.FourDots()
    }.width('100%').height(this.isWide ? 52 : 64)
      .padding({ left: 24, right: 24, top: this.isWide ? 8 : 8 })
      .zIndex(2)
  }

  @Builder
  private Display() {
    Column() {
      if (this.justEvaluated) {
        Text(this.answer).fontSize(this.isWide ? 38 : 58).fontWeight(FontWeight.Bold)
          .fontColor(this.answer === '错误' ? '#C62828' : '#111111').maxLines(1)
          .textOverflow({ overflow: TextOverflow.Ellipsis }).width('100%').textAlign(TextAlign.End)
          .animation({ duration: 180, curve: Curve.EaseOut })
      } else {
        Text(this.shownExpression().length > 0 ? this.shownExpression() : '0')
          .fontSize(this.isWide ? 30 : 56).fontWeight(FontWeight.Bold).fontColor('#111111').maxLines(2)
          .textOverflow({ overflow: TextOverflow.Ellipsis }).width('100%').textAlign(TextAlign.End)
        Text(this.expression.length > 0 ? this.answer : '').fontSize(this.isWide ? 18 : 30).fontWeight(FontWeight.Normal)
          .fontColor(this.answer === '错误' ? '#C62828' : '#7B8088').maxLines(1)
          .textOverflow({ overflow: TextOverflow.Ellipsis }).width('100%').textAlign(TextAlign.End)
      }
      if (!this.isWide) {
        Text(this.scientific ? (this.degreeMode ? 'Deg' : 'Rad') : '').fontSize(15).fontColor('#7A7F87')
          .width('100%').textAlign(TextAlign.Start)
      }
    }.justifyContent(FlexAlign.End).width('100%').height(this.isWide ? 52 : 220)
      .padding({
        left: 26,
        // 横屏时为右上角的四点按钮留出与原型一致的视觉间隔。
        right: this.isWide ? 72 : 26,
        bottom: this.isWide ? 4 : 12
      })
  }

  @Builder
  private StandardPad() {
    Column({ space: 10 }) {
      Row() { this.KeyCell('C', () => this.clear(), true); this.KeyCell('÷', () => this.inputOperator('/'), true); this.KeyCell('×', () => this.inputOperator('*'), true); this.KeyCell('⌫', () => this.backspace(), true) }.layoutWeight(1).width('100%')
      Row() { this.KeyCell('7', () => this.inputDigit('7')); this.KeyCell('8', () => this.inputDigit('8')); this.KeyCell('9', () => this.inputDigit('9')); this.KeyCell('−', () => this.inputOperator('-'), true) }.layoutWeight(1).width('100%')
      Row() { this.KeyCell('4', () => this.inputDigit('4')); this.KeyCell('5', () => this.inputDigit('5')); this.KeyCell('6', () => this.inputDigit('6')); this.KeyCell('+', () => this.inputOperator('+'), true) }.layoutWeight(1).width('100%')
      Row() {
        Column({ space: 10 }) {
          Row() { this.KeyCell('1', () => this.inputDigit('1')); this.KeyCell('2', () => this.inputDigit('2')); this.KeyCell('3', () => this.inputDigit('3')) }.layoutWeight(1).width('100%')
          Row() { this.KeyCell('%', () => this.applyUnary('percent')); this.KeyCell('0', () => this.inputDigit('0')); this.KeyCell('.', () => this.inputDigit('.')) }.layoutWeight(1).width('100%')
        }.layoutWeight(3).height('100%')
        Row() {
          Button() {
            if (this.isWide) {
              Row() {
                Text('=').fontSize(34).fontWeight(FontWeight.Medium).fontColor(Color.White).width('68%')
                  .textAlign(TextAlign.Center)
                Image($r('app.media.cat_15')).width('32%').height('82%').objectFit(ImageFit.Contain)
              }.width('100%').height('100%')
            } else {
              Stack({ alignContent: Alignment.Center }) {
                Image($r('app.media.cat_15')).width('95%').height('54%').objectFit(ImageFit.Contain)
                  .align(Alignment.Top).margin({ top: 10 })
                Text('=').fontSize(34).fontWeight(FontWeight.Medium).fontColor(Color.White)
                  .translate({ y: 48 }).zIndex(3)
              }.width('100%').height('100%')
            }
          }.backgroundColor(BLUE).borderRadius(52).width('100%').height('100%')
            .shadow({ radius: 10, color: '#450A59F7', offsetY: 4 })
            .translate({ x: this.buttonsAssembled ? 0 : -210, y: this.buttonsAssembled ? 0 : -260 })
            .scale({ x: this.buttonsAssembled ? 1 : 7, y: this.buttonsAssembled ? 1 : 7 })
            .opacity(this.buttonsAssembled ? 1 : 0)
            .animation({ duration: 650, curve: Curve.Friction }).onClick(() => this.equals())
        }.layoutWeight(1).height('100%').padding({ left: 5, right: 5 })
      }.layoutWeight(2).width('100%')
    }.width('100%').height('100%').layoutWeight(1)
      .padding(this.isWide ? { left: 32, right: 14, top: 0, bottom: 0 } :
        { left: 12, right: 12, top: 16, bottom: 18 })
  }

  @Builder
  private SciencePad() {
    Column({ space: 8 }) {
      Row() { this.KeyCell('(', () => this.inputToken('(')); this.KeyCell(')', () => this.inputToken(')')); this.KeyCell('1/x', () => this.applyUnary('reciprocal')) }.layoutWeight(1).width('100%')
      Row() { this.KeyCell('x²', () => this.applyUnary('square')); this.KeyCell('x³', () => this.applyUnary('cube')); this.KeyCell('xʸ', () => this.inputOperator('^')) }.layoutWeight(1).width('100%')
      Row() { this.KeyCell('x!', () => this.applyUnary('factorial')); this.KeyCell('√', () => this.applyUnary('sqrt')); this.KeyCell('ʸ√x', () => this.inputOperator('root')) }.layoutWeight(1).width('100%')
      Row() { this.KeyCell('e', () => this.inputToken('e')); this.KeyCell('ln', () => this.applyUnary('ln')); this.KeyCell('log', () => this.applyUnary('log')) }.layoutWeight(1).width('100%')
      Row() { this.KeyCell(this.inverse ? 'sin⁻¹' : 'sin', () => this.applyUnary(this.inverse ? 'asin' : 'sin')); this.KeyCell(this.inverse ? 'cos⁻¹' : 'cos', () => this.applyUnary(this.inverse ? 'acos' : 'cos')); this.KeyCell(this.inverse ? 'tan⁻¹' : 'tan', () => this.applyUnary(this.inverse ? 'atan' : 'tan')) }.layoutWeight(1).width('100%')
      Row() { this.KeyCell('Inv', () => this.inverse = !this.inverse, false, this.inverse); this.KeyCell(this.degreeMode ? 'Deg' : 'Rad', () => this.degreeMode = !this.degreeMode, false, true); this.KeyCell('π', () => this.inputToken('pi')) }.layoutWeight(1).width('100%')
    }.width('100%').height('100%').layoutWeight(1)
      .padding(this.isWide ? { left: 50, right: 4, top: 21, bottom: 18 } :
        { left: 12, right: 12, top: 16, bottom: 18 })
  }

  @Builder
  private MemoryRow() {
    Row({ space: 8 }) { this.KeyCell('MC', () => this.memoryChange('clear')); this.KeyCell('M+', () => this.memoryChange('add')); this.KeyCell('M−', () => this.memoryChange('subtract')); this.KeyCell('MR', () => this.memoryChange('recall')) }
      .height(this.isWide ? 30 : 48).width('100%')
      .padding({ left: this.isWide ? 32 : 12, right: this.isWide ? 14 : 12 })
  }

  @Builder
  private KeyArea() {
    if (this.scientific && this.isWide) {
      Row() {
        Column() { this.SciencePad() }.width('44%').height('100%')
        Column({ space: 8 }) {
          this.MemoryRow()
          Column() { this.StandardPad() }.layoutWeight(1).width('100%')
        }.layoutWeight(1).height('100%').padding({ top: 21, bottom: 18 })
      }.width('100%').layoutWeight(1).backgroundColor(PANEL_BG).borderRadius({ topLeft: 32, topRight: 32 })
    } else if (this.scientific) {
      Scroll() {
        Column() { this.MemoryRow(); Column() { this.SciencePad() }.height(320).width('100%'); Column() { this.StandardPad() }.height(490).width('100%') }.width('100%')
      }.layoutWeight(1).width('100%').backgroundColor(PANEL_BG).borderRadius({ topLeft: 32, topRight: 32 }).scrollBar(BarState.Off)
    } else {
      Column() { this.StandardPad() }.width('100%').layoutWeight(1).backgroundColor(PANEL_BG).borderRadius({ topLeft: 32, topRight: 32 })
    }
  }

  @Builder
  private MenuPopup() {
    Column() {
      Row({ space: 12 }) {
        Text(this.scientific ? '123' : 'ƒx').fontSize(22).fontColor(BLUE).width(38).textAlign(TextAlign.Center)
        Text(this.scientific ? '普通计算器' : '科学计算器').fontSize(18).fontColor('#171717')
      }.width('100%').height(58).padding({ left: 14, right: 18 }).onClick(() => this.setScientificMode(!this.scientific))
    }.width(178).backgroundColor(Color.White).borderRadius(18).shadow({ radius: 18, color: '#30000000', offsetY: 6 })
      .position({ x: Math.max(8, this.pageWidth - 194), y: this.isWide ? 58 : 67 })
  }

  @Builder
  private HistoryPage() {
    Column() {
      Row() {
        Button('‹').fontSize(this.isWide ? 34 : 42).fontColor('#171717').backgroundColor(KEY_BG)
          .width(this.isWide ? 40 : 52).height(this.isWide ? 40 : 52).borderRadius(28)
          .shadow({ radius: 8, color: '#18000000', offsetY: 3 }).onClick(() => { this.historyPage = false; })
        Text('历史记录').fontSize(this.isWide ? 22 : 27).fontWeight(FontWeight.Bold)
          .fontColor('#171717').margin({ left: this.isWide ? 10 : 14 })
        Blank()
        Button() { this.TrashIcon() }
          .backgroundColor(KEY_BG).width(this.isWide ? 40 : 52).height(this.isWide ? 40 : 52).borderRadius(28)
          .shadow({ radius: 8, color: '#18000000', offsetY: 3 }).onClick(() => { this.clearAllHistory(); })
      }.height(this.isWide ? 52 : 78).width('100%')
        .padding({ left: this.isWide ? 24 : 20, right: this.isWide ? 24 : 20, top: this.isWide ? 8 : 10 })
      Text('今天').fontSize(this.isWide ? 15 : 19).fontColor('#858A92')
        .width(this.isWide ? '70%' : '100%').alignSelf(ItemAlign.Center)
        .padding({ left: this.isWide ? 12 : 34, top: this.isWide ? 12 : 20, bottom: this.isWide ? 12 : 16 })
      if (this.history.length === 0) {
        Column() {
          Text('暂无历史记录').fontSize(17).fontColor('#A0A5AD')
          Text('完成一次计算后会显示在这里').fontSize(14).fontColor('#C0C4CA').margin({ top: 8 })
        }.width(this.isWide ? '70%' : '100%').alignSelf(ItemAlign.Center).margin({ top: this.isWide ? 18 : 34 })
      } else {
        List({ space: 12 }) {
            ForEach(this.history, (item: string, index: number) => {
              ListItem() {
                Stack({ alignContent: Alignment.End }) {
                  Row() {
                    this.TrashIcon(Color.White)
                  }.width(this.isWide ? 60 : 76).height('100%').justifyContent(FlexAlign.Center).backgroundColor('#F04438')
                    .onClick(() => { this.removeHistory(index); })
                  Column() {
                    Text(this.historyExpression(item)).fontSize(this.isWide ? 16 : 19).fontColor('#979CA4').width('100%')
                    Text(`=${this.historyResult(item)}`).fontSize(this.isWide ? 23 : 28).fontWeight(FontWeight.Medium)
                      .fontColor('#111111').width('100%').margin({ top: this.isWide ? 2 : 5 })
                  }
                  .justifyContent(FlexAlign.Center).width('100%').height('100%')
                  .padding({ left: this.isWide ? 12 : 20, right: this.isWide ? 12 : 20 })
                  .backgroundColor(KEY_BG).translate({ x: this.swipeIndex === index ? this.swipeOffset : 0 })
                  .animation({ duration: 180, curve: Curve.EaseOut })
                  .gesture(PanGesture({ direction: PanDirection.Horizontal })
                    .onActionStart(() => { this.swipeIndex = index; this.swipeOffset = 0; })
                    .onActionUpdate((event: GestureEvent) => {
                      const revealWidth: number = this.isWide ? 60 : 76;
                      this.swipeOffset = Math.max(-revealWidth, Math.min(0, event.offsetX));
                    })
                    .onActionEnd(() => {
                      const revealWidth: number = this.isWide ? 60 : 76;
                      this.swipeOffset = this.swipeOffset < -revealWidth * 0.42 ? -revealWidth : 0;
                    }))
                }.width('100%').height(this.isWide ? 64 : 92).borderRadius(this.isWide ? 18 : 22).clip(true)
              }.width('100%')
            }, (item: string) => item)
        }.layoutWeight(1).width(this.isWide ? '70%' : '100%').alignSelf(ItemAlign.Center)
          .padding({ left: this.isWide ? 0 : 20, right: this.isWide ? 0 : 20, bottom: this.isWide ? 12 : 24 })
          .scrollBar(BarState.Auto)
      }
    }.width('100%').height('100%').backgroundColor(PAGE_BG)
  }

  @Builder
  private FlyingSymbol(symbol: string, x: number, y: number, angle: number) {
    Text(symbol).fontSize(42).fontWeight(FontWeight.Bold).fontColor(Color.White)
      .position({ x: x, y: y }).rotate({ angle: angle + this.introSpin })
      .scale({ x: this.symbolReveal * (this.introStage === 1 ? 1 : 0.75), y: this.symbolReveal * (this.introStage === 1 ? 1 : 0.75) })
      .opacity(this.symbolReveal).animation({ duration: 620, curve: Curve.EaseOut })
  }

  @Builder
  private LaunchOverlay() {
    Stack({ alignContent: Alignment.Center }) {
      if (this.introStage === 1) {
        Text('0').fontSize(210).fontWeight(FontWeight.Bold).fontColor(Color.White)
          .rotate({ angle: this.introSpin / 8 }).scale({ x: this.introScale, y: this.introScale })
          .opacity(this.introScale).animation({ duration: 620, curve: Curve.EaseOut })
        this.FlyingSymbol('+', 24, 150, -25)
        this.FlyingSymbol('−', 290, 120, 32)
        this.FlyingSymbol('×', 54, 570, 48)
        this.FlyingSymbol('÷', 300, 530, -35)
        this.FlyingSymbol('%', 20, 360, 18)
        this.FlyingSymbol('=', 315, 350, -15)
      } else if (this.introStage === 2) {
        Row({ space: 120 }) {
          Text('(').fontSize(190).fontWeight(FontWeight.Bold).fontColor(Color.White).rotate({ angle: -28 })
          Text(')').fontSize(190).fontWeight(FontWeight.Bold).fontColor(Color.White).rotate({ angle: 28 })
        }
        Text('•').fontSize(38).fontColor(Color.White).scale({ x: this.introScale, y: this.introScale })
        Row({ space: 10 }) {
          ForEach(['1', '2', '3', '4', '5', '6', '7', '8', '9'], (digit: string) => {
            Text(digit).fontSize(25).fontColor(Color.White).translate({ y: this.digitLift })
              .scale({ x: this.digitScale, y: this.digitScale }).rotate({ angle: this.introSpin })
              .animation({ duration: 430, curve: Curve.EaseIn })
          })
        }.align(Alignment.Bottom).margin({ bottom: 80 })
      } else if (this.introStage === 3) {
        Text('ERROR: 数学系统正在重启……').fontSize(21).fontColor('#FF4D4F').fontFamily('monospace')
      } else if (this.introStage === 4) {
        Text('正在加载小学数学…… 99%').fontSize(21).fontColor(Color.White).fontFamily('monospace')
      } else if (this.introStage === 5) {
        Column({ space: 22 }) {
          Text('加载失败。正在加载计算器。').fontSize(20).fontColor('#FFD666').fontFamily('monospace')
          Text('=').fontSize(180).fontWeight(FontWeight.Bold).fontColor(BLUE)
            .scale({ x: this.introScale, y: this.introScale }).animation({ duration: 420, curve: Curve.EaseOut })
        }
      }
      if (this.introFlash > 0) {
        Row().width('100%').height('100%').backgroundColor(Color.White).opacity(this.introFlash)
          .animation({ duration: 220, curve: Curve.EaseOut })
      }
    }
    .width('100%').height('100%').backgroundColor(Color.Black)
    .opacity(this.introStage === 6 ? 0 : 1).animation({ duration: 140, curve: Curve.EaseOut })
  }

  build() {
    Stack({ alignContent: Alignment.Top }) {
      if (this.historyPage) {
        this.HistoryPage()
      } else {
        Image(this.isWide ? $r('app.media.ronaldo_landscape_bg') : $r('app.media.spider_user_portrait_bg'))
          .width('100%').height('100%').objectFit(ImageFit.Cover)
        Row().width('100%').height('100%')
          .backgroundColor(this.isWide ? '#8AF3F6FC' : '#38F3F6FC')
        if (this.isWide) {
          Column() {
            Stack({ alignContent: Alignment.Top }) {
              Column() { this.Display() }.width('100%').translate({ y: 8 }).zIndex(1)
              // 顶部工具栏最后绘制，确保透明显示层不会拦截左右按钮的触摸事件。
              this.Header()
            }.width('100%').height(90)
            this.KeyArea()
          }.width('100%').height('100%').translate({ x: this.interfaceX })
        } else {
          Column() { this.Header(); this.Display(); this.KeyArea() }
            .width('100%').height('100%').translate({ x: this.interfaceX })
        }
        if (this.scientific && this.isWide) {
          Text(this.degreeMode ? 'Deg' : 'Rad').fontSize(15).fontColor('#7A7F87').position({ x: 26, y: 52 })
        }
        if (this.menuVisible) this.MenuPopup()
        if (this.bootHintVisible) {
          Text('数学系统已勉强启动').fontSize(12).fontColor('#8A8F98').align(Alignment.Top)
            .margin({ top: this.isWide ? 105 : 195 }).opacity(this.bootHintVisible ? 1 : 0)
        }
      }
      if (this.introVisible) this.LaunchOverlay()
    }.width('100%').height('100%').backgroundColor(PAGE_BG)
      .onAreaChange((_oldArea: Area, newArea: Area) => {
        this.pageWidth = Number(newArea.width);
        this.isWide = this.pageWidth >= 680;
      })
  }
}
