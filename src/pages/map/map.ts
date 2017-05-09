import { Component, AfterViewInit, ViewChild, NgZone } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Subject, Observable } from 'rxjs';

class PositionChange {
  private xValue: number;
  private yValue: number;

  constructor(x: number, y: number) {
    this.xValue = x;
    this.yValue =y;
  }

  get x(): number {
    return this.xValue;
  }

  get y(): number {
    return this.yValue;
  }
}

@Component({
  selector: 'map-app',
  templateUrl: 'map.html'
} )
export class MapApp implements AfterViewInit {
  @ViewChild("canvasMap") public  canvasMap;
  public x: number;
  public y:number;
  public pathVisible: boolean;
  private accelerationStream: Observable<PositionChange>;
  private testStream: Observable<PositionChange>;

  constructor(private zone:NgZone, public navCtrl: NavController) {
      this.pathVisible = true;
      let accelerationSubject = new Subject();
      this.accelerationStream = accelerationSubject.asObservable();
      this.testStream = Observable.interval(100).throttleTime(1000).map( ()=> new PositionChange( Math.floor(Math.random()*5)-2, Math.floor(Math.random()*5) ) );

      document.addEventListener("deviceready", () => {
        Observable.interval(500).subscribe( ()=> {
          let n:any = navigator;
          n.accelerometer.getCurrentAcceleration( (acceleration) => {
            accelerationSubject.next( new PositionChange(-acceleration.x, acceleration.y) );
          } ), (e:any) => alert(`Accelerometer error ${e}`);
        } );
      }, false);

      this.x = 195;
      this.y = 240;
    }

    ngAfterViewInit() {
      let map = this.canvasMap.nativeElement;
      let w: any = window;
      let createjs: any = w.createjs;
      var stage = new createjs.Stage( map );

      var mapImg = new createjs.Bitmap("assets/map.svg");
      stage.addChild( mapImg );
      let pathContainer = new createjs.Container();
      stage.addChild( pathContainer );

      // Put streams to conat, use testStream only for debug purposes. Use accelerationStream for acceleration navigation
      Observable.concat(this.accelerationStream).subscribe( (pc: PositionChange)=> {
        this.zone.run( () => {
          this.x = Math.round( this.x + pc.x );
          this.y = Math.round( this.y + pc.y );
          if( !this.pathVisible ) pathContainer.removeAllChildren();

          var rect = new createjs.Shape();
          rect.graphics.beginFill( "#000" ).drawRect( this.x, this.y, 5, 5 );
          pathContainer.addChild( rect );
          stage.update();
        } );
      } );
    }
}
