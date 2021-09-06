import { fromEvent,interval,Observable } from 'rxjs'; 
import { map,filter,flatMap,takeUntil,merge,scan } from 'rxjs/operators';

class Tick {
  constructor(public readonly elapsed:number) {}
}
class Rotate {
  constructor(public readonly angle:number) {}
}
enum KeyCode { LeftKey=37, UpKey=38, RightKey=39 }
interface State {
  readonly x:number,readonly y:number,
  readonly angle:number,readonly rotation:number,
  readonly torque:number
}
function asteroidsObservable2() {
  interface State {
    readonly x: number;
    readonly y: number;
    readonly angle: number;
  }
  const initialState: State = { x: 100, y: 100, angle: 0};
  function rotate(s:State, angleDelta:number): State {
    return { ...s,
      angle: s.angle + angleDelta
    }
  }
  function updateView(state:State): void {
    const ship = document.getElementById("ship")!;
    ship.setAttribute('transform',
     `translate(${state.x},${state.y}) rotate(${state.angle})`)
  }
  fromEvent<KeyboardEvent>(document, 'keydown')
    .pipe(
      filter(({key})=>key === 'ArrowLeft' || key === 'ArrowRight'),
      filter(({repeat})=>!repeat),
      flatMap(d=>interval(10).pipe(
        takeUntil(fromEvent<KeyboardEvent>(document, 'keyup').pipe(
          filter(({key})=>key === d.key)
        )),
        map(_=>d))
      ),
      map(d=>d.key==='ArrowLeft'?-1:1),
      scan(rotate, initialState))
    .subscribe(updateView)
}
function asteroids() {
    const ship = document.getElementById("ship")!;
    const leftThruster = document.getElementById("leftThrust")!;
    const rightThruster = document.getElementById("rightThrust")!;
    const state:State = {
        x:50,y:50,angle:0,
        rotation:0,
        torque:0
    }
    function keyEvent<T>(eventName:string,keyCode:number,result:()=>T):Observable<T> {
      return fromEvent<KeyboardEvent>(document,eventName)
          .pipe(
            filter(e=>e.keyCode===keyCode),
            map(result))
    }
    const 
      startLeftRotate = keyEvent('keydown',KeyCode.LeftKey,()=>new Rotate(-.1)),
      startRightRotate = keyEvent('keydown',KeyCode.RightKey,()=>new Rotate(.1)),
      stopLeftRotate = keyEvent('keyup',KeyCode.LeftKey,()=>new Rotate(0)),
      stopRightRotate = keyEvent('keyup',KeyCode.RightKey,()=>new Rotate(0))
      
    interval(10).pipe(
      map(elapsed=>new Tick(elapsed)),
      merge(startLeftRotate,startRightRotate,stopLeftRotate,stopRightRotate),
      scan((s:State,e:Tick|Rotate)=>
        e instanceof Rotate ? {...s,
          torque:e.angle
        } : {...s,
          angle:s.angle+s.rotation,
          rotation:s.rotation+s.torque
        }, state)
      )
      .subscribe({next:s=>{
        ship.setAttribute('transform',
          `translate(${s.x},${s.y}) rotate(${s.angle})`)
        if(s.torque < 0)
          leftThruster.classList.remove('hidden');
        else if(s.torque > 0)
          rightThruster.classList.remove('hidden');
        else {
          leftThruster.classList.add('hidden');
          rightThruster.classList.add('hidden');
        }
      }})
}

setTimeout(asteroidsObservable2, 0)
//window.onload = asteroids

function showKeys() {
  function showKey(elementId,keyCode) {
    fromEvent<KeyboardEvent>(document,'keydown')
      .pipe(filter(e=>e.keyCode === keyCode))
      .subscribe(e=>{
        const arrowKey = document.getElementById(elementId)!;
        arrowKey.classList.add("highlight");
      })
    fromEvent<KeyboardEvent>(document,'keyup')
      .pipe(filter(e=>e.keyCode === keyCode))
      .subscribe(e=>{
        const arrowKey = document.getElementById(elementId)!;
        arrowKey.classList.remove("highlight");
      })
  }
  showKey("leftarrow",37);
  showKey("rightarrow",39);
}

setTimeout(showKeys, 0)