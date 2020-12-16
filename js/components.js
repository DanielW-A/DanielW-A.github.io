const LinkType = {
    DIRECT: 'direct',
    ARC: 'arc',
    SELF: 'self'
}
const nodeRadius = 30; 
const mousePadding = 5;

class viewable{
    constructor(x,y){
        this.x = x;
        this.y = y;
    }
}

class Link extends viewable {
    constructor(startNode,x,y){
        super(x,y);
        this.startNode = startNode;
        this.endNode = null;
        this.type = null;
        this.endPos = {
            x :0,
            y :0
        };
        this.startPos = {
            x :0,
            y :0
        };
        this.anchorAngle = 0;
    }

    setAnchorangle(mousePos){
        this.anchorAngle = Math.atan2(mousePos.y - this.startNode.y, mousePos.x - this.startNode.x) + 0; //this.mouseOffsetAngle;
        console.log(this.anchorAngle);
        if(this.anchorAngle < -Math.PI) this.anchorAngle += 2 * Math.PI;
	    if(this.anchorAngle > Math.PI) this.anchorAngle -= 2 * Math.PI;
    }
 
    det(a, b, c, d, e, f, g, h, i) {
        return a*e*i + b*f*g + c*d*h - a*f*h - b*d*i - c*e*g;
    }

    circleFromThreePoints(x1, y1, x2, y2, x3, y3) {
        var a = this.det(x1, y1, 1, x2, y2, 1, x3, y3, 1);
        var bx = -this.det(x1*x1 + y1*y1, y1, 1, x2*x2 + y2*y2, y2, 1, x3*x3 + y3*y3, y3, 1);
        var by = this.det(x1*x1 + y1*y1, x1, 1, x2*x2 + y2*y2, x2, 1, x3*x3 + y3*y3, x3, 1);
        var c = -this.det(x1*x1 + y1*y1, x1, y1, x2*x2 + y2*y2, x2, y2, x3*x3 + y3*y3, x3, y3);
        return {
            'x': -bx / (2*a),
            'y': -by / (2*a),
            'radius': Math.sqrt(bx*bx + by*by - 4*a*c) / (2*Math.abs(a))
        };
    }
}

class StationaryLink extends Link {
    constructor(startNode,endNode,text,anchorAngle){
        super(startNode,(startNode.x + endNode.x)/2,(startNode.y + endNode.y)/2);
        this.endNode = endNode;
        this.text = (text == null)? "" : text;
		this.type = (endNode === startNode)? LinkType.SELF: LinkType.DIRECT;
        this.perpendicularPart = 0;
        this.parallelPart = 0.5;
        this.anchorAngle = anchorAngle;

        if (this.type === LinkType.SELF){ //TODO
            this.x = this.startNode.x + 1.5 * nodeRadius * Math.cos(this.anchorAngle);
            this.y = this.startNode.y + 1.5 * nodeRadius * Math.sin(this.anchorAngle);
        }
    }

    getAnchorPoint() {
        var dx = this.endNode.x - this.startNode.x;
        var dy = this.endNode.y - this.startNode.y;
        var scale = Math.sqrt(dx * dx + dy * dy);
        return {
            'x': this.startNode.x + dx * this.parallelPart - dy * this.perpendicularPart / scale,
            'y': this.startNode.y + dy * this.parallelPart + dx * this.perpendicularPart / scale
        };
    }

    draw(c,isSelected){
        if (this.type === LinkType.SELF){
            var circleX = this.startNode.x + 1.5 * nodeRadius * Math.cos(this.anchorAngle);
            var circleY = this.startNode.y + 1.5 * nodeRadius * Math.sin(this.anchorAngle);
            var circleRadius = 0.75 * nodeRadius;
            var startAngle = this.anchorAngle - Math.PI * 0.8;
            var endAngle = this.anchorAngle + Math.PI * 0.8;
    

            c.beginPath();
            c.arc(circleX, circleY, circleRadius, startAngle, endAngle, false);
            c.stroke();

        } else if(this.type === LinkType.DIRECT){
            this.startPos = this.startNode.closestPointOnCircle(this.x, this.y);
            this.endPos = this.endNode.closestPointOnCircle(this.x, this.y);
            
            c.beginPath();
		    c.moveTo(this.startPos.x, this.startPos.y);
		    c.lineTo(this.endPos.x, this.endPos.y);
            c.stroke();
        } else {
            var anchor = this.getAnchorPoint();
            var circle = this.circleFromThreePoints(this.startNode.x, this.startNode.y, this.endNode.x, this.endNode.y, anchor.x, anchor.y);
            var isReversed = (this.perpendicularPart > 0);
            var reverseScale = isReversed ? 1 : -1;
            var startAngle = Math.atan2(this.startNode.y - circle.y, this.startNode.x - circle.x) - reverseScale * nodeRadius / circle.radius;
            var endAngle = Math.atan2(this.endNode.y - circle.y, this.endNode.x - circle.x) + reverseScale * nodeRadius / circle.radius;
            this.startPos.x = circle.x + circle.radius * Math.cos(startAngle);
            this.startPos.y = circle.y + circle.radius * Math.sin(startAngle);
            this.endPos.x = circle.x + circle.radius * Math.cos(endAngle);
            this.endPos.y = circle.y + circle.radius * Math.sin(endAngle);
        }

        addText(c,this.text,this.x,this.y,null,isSelected);
    }

    isNear(mouse){
        if (this.type === LinkType.SELF){
	        var dx = mouse.x - (this.startNode.x + 1.5 * nodeRadius * Math.cos(this.anchorAngle));
	        var dy = mouse.y - (this.startNode.y + 1.5 * nodeRadius * Math.sin(this.anchorAngle));
	        var distance = Math.sqrt(dx*dx + dy*dy) - 0.75 * nodeRadius;
	        return (Math.abs(distance) < mousePadding);
        }else
        if((mouse.x < Math.max(this.startPos.x,this.endPos.x) + mousePadding) && 
                (mouse.x > Math.min(this.startPos.x,this.endPos.x) - mousePadding) &&  
                (mouse.y < Math.max(this.startPos.y,this.endPos.y) + mousePadding) &&  
                (mouse.y > Math.min(this.startPos.y,this.endPos.y) - mousePadding)){

            var d = (((this.endPos.x - this.startPos.x)*(this.startPos.y - mouse.y)) -
                        ((this.startPos.x - mouse.x) * (this.endPos.y - this.startPos.y)))/
                        Math.sqrt(Math.pow((this.endNode.x-this.startNode.x),2)+Math.pow((this.endNode.y-this.startNode.y),2));
            console.log(d);
            return (d < mousePadding);
        }
        
    }
    

}