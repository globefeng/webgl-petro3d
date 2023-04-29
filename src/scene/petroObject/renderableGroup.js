
export function RenderableGroup(name, id, sceneInfo) {
    this.sceneInfo = sceneInfo;

    var renderableChildren = [];

    this.name = name;
    this.id = id;
    this.visible = true;

    this.addChild = function(renderableObject) {
        renderableChildren.push(renderableObject);
    }

    this.draw = function () {
        if (!this.sceneInfo.isVisible(this.id))  return;

        for (var i = 0; i < renderableChildren.length; i++) {
            renderableChildren[i].draw();
        };
    }

    this.tryPicking = function (pickedID, pickResult) {
        // if (!IsVisible(this.id) || pickResult.Status != 0) return;

        for (var i = 0; i < renderableChildren.length; i++) {
                renderableChildren[i].tryPicking(pickedID, pickResult);
        };
    }

}