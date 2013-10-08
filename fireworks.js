#!/Users/kwilson/bin/jjs -fx -scripting

var ArrayList      = Java.type("java.util.ArrayList");
var File           = Java.type("java.io.File");

var AnimationTimer = Java.type("javafx.animation.AnimationTimer");
var BlendMode      = Java.type("javafx.scene.effect.BlendMode");
var Canvas         = Java.type("javafx.scene.canvas.Canvas");
var Color          = Java.type("javafx.scene.paint.Color");
var CycleMethod    = Java.type("javafx.scene.paint.CycleMethod");
var Group          = Java.type("javafx.scene.Group");
var ImageView      = Java.type("javafx.scene.image.ImageView");
var Pane           = Java.type("javafx.scene.layout.Pane");
var RadialGradient = Java.type("javafx.scene.paint.RadialGradient");
var Reflection     = Java.type("javafx.scene.effect.Reflection");
var Scene          = Java.type("javafx.scene.Scene");
var Stop           = Java.type("javafx.scene.paint.Stop");

var AnimationTimerExtend = Java.extend(AnimationTimer);

var doubleArray    = Java.type("double[]");

var GRAVITY = 0.06;

function Particle(posX, posY, velX, velY, targetX, targetY, color, size, usePhysics, shouldExplodeChildren, hasTail) {
    this.posX                  = posX;
    this.posY                  = posY;
    this.velX                  = velX;
    this.velY                  = velY;
    this.targetX               = targetX;
    this.targetY               = targetY;
    this.color                 = color;
    this.size                  = size;
    this.usePhysics            = usePhysics;
    this.shouldExplodeChildren = shouldExplodeChildren;
    this.hasTail               = hasTail;
    this.alpha                 = 1;
    this.easing                = Math.random() * 0.02;
    this.fade                  = Math.random() * 0.1;
}

Particle.prototype.update = function() {
    this.lastPosX = this.posX;
    this.lastPosY = this.posY;

    if(this.usePhysics) { // on way down
        this.velY += GRAVITY;
        this.posY += this.velY;
        this.alpha -= this.fade; // fade out particle
    } else { // on way up
        var distance = (this.targetY - this.posY);
        // ease the position
        this.posY += distance * (0.03 + this.easing);
        // cap to 1
        this.alpha = Math.min(distance * distance * 0.00005, 1);
    }

    this.posX += this.velX;

    return this.alpha < 0.005;
}


Particle.prototype.draw = function(context) {
    var x    = Math.round(this.posX);
    var y    = Math.round(this.posY);
    var xVel = (x - this.lastPosX) * -5;
    var yVel = (y - this.lastPosY) * -5;

    // set the opacity for all drawing of this particle
    context.globalAlpha = Math.random() * this.alpha;
    // draw particle
    context.fill = this.color;
    context.fillOval(x - this.size, y - this.size, this.size + this.size, this.size + this.size);

    // draw the arrow triangle from where we were to where we are now
    if (this.hasTail) {
        context.fill = Color.rgb(255, 255, 255, 0.3);
        var x = new doubleArray(3);
        var y = new doubleArray(3);
        x[0] = this.posX + 1.5;  y[0] = this.posY;
        x[1] = this.posX + xVel; y[1] = this.posY + yVel;
        x[2] = this.posX - 1.5;  y[2] = this.posY;
        context.fillPolygon(x, y, 3);
    }
}

function drawFireworks(gc) {
    var iter = particles.iterator();
    var newParticles = new ArrayList();

    while(iter.hasNext()) {
        var firework = iter.next();

        // if the update returns true then particle has expired
        if(firework.update()) {
            // remove particle from those drawn
            iter.remove();

            // check if it should be exploded
            if(firework.shouldExplodeChildren) {
                if(firework.size == 9) {
                    explodeCircle(firework, newParticles);
                } else if(firework.size == 8) {
                    explodeSmallCircle(firework, newParticles);
                }
            }
        }

        firework.draw(gc);
    }

    particles.addAll(newParticles);
}

function fireParticle() {
    particles.add(new Particle(
        surface.width * 0.5, surface.height + 10,
        Math.random() * 5 - 2.5, 0,
        0, 150 + Math.random() * 100,
        colors[0], 9,
        false, true, true));
}

function explodeCircle(firework, newParticles) {
    var count = 20 + (60 * Math.random());
    var shouldExplodeChildren = Math.random() > 0.5;
    var angle = (Math.PI * 2) / count;
    var color = (Math.random() * (colors.length - 1));

    for(var i=count; i>0; i--) {
        var randomVelocity = 4 + Math.random() * 4;
        var particleAngle = i * angle;

        newParticles.add(
            new Particle(
                firework.posX, firework.posY,
                Math.cos(particleAngle) * randomVelocity, Math.sin(particleAngle) * randomVelocity,
                0, 0,
                colors[Math.ceil(color)],
                8,
                true, shouldExplodeChildren, true));
    }
}

function explodeSmallCircle(firework, newParticles) {
    var angle = (Math.PI * 2) / 12;

    for(var count = 12; count > 0; count--) {
        var randomVelocity = 2 + Math.random() * 2;
        var particleAngle = count * angle;
        newParticles.add(
            new Particle(
                firework.posX, firework.posY,
                Math.cos(particleAngle) * randomVelocity, Math.sin(particleAngle) * randomVelocity,
                0, 0,
                firework.color,
                4,
                true, false, false));
    }
}

function fileToURL(file) {
    return new File(file).toURI().toURL().toExternalForm();
}

var timer = new AnimationTimerExtend() {
    handle: function handle(now) {
        var gc = surface.graphicsContext2D;
        // clear area with transparent black
        gc.fill = Color.rgb(0, 0, 0, 0.2);
        gc.fillRect(0, 0, 1024, 708);
        // draw fireworks
        drawFireworks(gc);

        // countdown to launching the next firework
        if (countDownTillNextFirework <= 0) {
            countDownTillNextFirework = 10 + (Math.random() * 30);
            fireParticle();
        }

        countDownTillNextFirework--;
    }
};

// Kill timer before exiting.
function stop() {
    timer.stop();
}

var particles = new ArrayList();
var countDownTillNextFirework = 40;

// create a color palette of 180 colors
var colors = new Array(181);
var stops = new ArrayList();
stops.add(new Stop(0, Color.WHITE));
stops.add(new Stop(0.2, Color.hsb(59, 0.38, 1)));
stops.add(new Stop(0.6, Color.hsb(59, 0.38, 1,0.1)));
stops.add(new Stop(1, Color.hsb(59, 0.38, 1,0)));
colors[0] = new RadialGradient(0, 0, 0.5, 0.5, 0.5, true, CycleMethod.NO_CYCLE, stops);

for (var h = 0; h < 360; h += 2) {
    var stops2 = new ArrayList();
    stops2.add(new Stop(0, Color.WHITE));
    stops2.add(new Stop(0.2, Color.hsb(h, 1, 1)));
    stops2.add(new Stop(0.6, Color.hsb(h, 1, 1,0.1)));
    stops2.add(new Stop(1, Color.hsb(h, 1, 1,0)));
    colors[1 + (h / 2)] = new RadialGradient(0, 0, 0.5, 0.5, 0.5, true, CycleMethod.NO_CYCLE, stops2);
}

var surface = new Canvas(1024, 500);
surface.blendMode = BlendMode.ADD;
surface.effect = new Reflection(0, 0.4, 0.15, 0);

var imageUrl = fileToURL("sf.jpg");
var background = new ImageView(imageUrl);

var pane = new Pane();
pane.children.add(background);
pane.children.add(surface);

var root = new Group();
root.children.add(pane);
$STAGE.scene = new Scene(root);

timer.start();

