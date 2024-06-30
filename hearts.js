import {HeartsModel} from "./hearts_model.js";
import {HeartsController} from "./hearts_controller.js";
import {HeartsView} from "./hearts_view.js";


let model = new HeartsModel();
let controller = new HeartsController(model);

let view = new HeartsView(model, controller);

view.render(document.getElementById('main'));