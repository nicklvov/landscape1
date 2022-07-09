// functions /////////////////////
//const coneMaterial = new BABYLON.StandardMaterial("material", scene);
//coneMaterial.diffuseColor = BABYLON.Color3.Red();
function arbitraryRotation(dir1, dir2, mesh) {
  let norm_dir1 = new BABYLON.Vector3(0, 1, 0);
  let norm_dir2 = new BABYLON.Vector3(0, 1, 0);
  dir1.normalizeToRef(norm_dir1);
  dir2.normalizeToRef(norm_dir2);
  let crossDif = BABYLON.Vector3.Cross(norm_dir1, norm_dir2);
  let cos_angle_rot = BABYLON.Vector3.Dot(norm_dir1, norm_dir2);
  let angle_rot = Math.acos(cos_angle_rot) + Math.PI;
  const quaternion = new BABYLON.Quaternion.RotationAxis(crossDif, angle_rot);
  mesh.rotationQuaternion = quaternion;
}

const makeLayer = function (sizeX, sizeY) {
  let layer = [];
  for (let i = 0; i < sizeY; i++) {
    let row = [];
    for (let j = 0; j < sizeX; j++) {
      row.push(0);
    }
    layer.push(row);
  }
  return layer;
};

const getActiveCells = function (layer, sizeX, sizeY, activeValue) {
  let cells = [];
  for (let i = 0; i < sizeX; i++) {
    for (let j = 0; j < sizeY; j++) {
      //console.log("i=",i,"j=",j,"value=",layer[i][j])
      if (layer[i][j] === activeValue) {
        cells.push([i, j]);
      }
    }
  }
  return cells;
};

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

const distance = function (a, b) {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
};

const makeKnots = function (nLayers, sizeX, sizeY) {
  const nPoints = 100;
  // original layer
  let layer0 = makeLayer(sizeX, sizeY);
  layer0[sizeX / 2][sizeY / 2] = 2;
  let layer1 = makeLayer(sizeX, sizeY);
  layer1[sizeX / 2][sizeY / 2] = 1;
  let cellVoxels = [];
  cellVoxels.push(layer0);
  cellVoxels.push(layer1);
  for (i = 2; i < nLayers; i++) {
    let layer = makeLayer(sizeX, sizeY);

    if (i > 1) {
      for (let j = 0; j < nPoints; j++) {
        const x = getRandomInt(sizeX - 1);
        const y = getRandomInt(sizeY - 1);
        //console.log("x=", x, " y=", y);
        if (x < sizeX && y < sizeY) {
          layer[x][y] = 1;
        }
      }
    }
    cellVoxels.push(layer);
  }
  return cellVoxels;
};

const makeTree2 = function (knots, n, sizeX, sizeY) {
  console.log("makeTree2");
  const maxdist = 3;
  let verticies = []; // array of objects
  let v = 1;
  let startIndex = 0;
  let endIndex = 0;
  const objVert = {
    vertex: v,
    place: [sizeX / 2, 0, sizeY / 2],
    coords: new BABYLON.Vector3(0, 0, 0),
    successors: [],
  };
  verticies.push(objVert);

  for (let k = 0; k < n - 1; k++) {
    const fieldUp = knots[k + 1]; // layer of the 3d grid
    //console.log("fieldUp= ", fieldUp);
    let activeUp = getActiveCells(fieldUp, sizeX, sizeY, 1);
    //look for upper neighbours
    //console.log("k= ", k);
    //console.log("activeUp= ", activeUp);
    for (let i = startIndex; i <= endIndex; i++) {
      const objVert = verticies[i]; // low object
      console.log("i= ", i, " objVert= ", objVert);
      activeUp.forEach((neighbor) => {
        //look over upper knots
        const point = [neighbor[0], k + 1, neighbor[1]];
        const d = distance(point, objVert.place);
        if (d < maxdist && fieldUp[neighbor[0]][neighbor[1]] === 1) {
          v = v + 1;
          objVert.successors.push(v);

          // create object for the successor
          const objVertNeighbor = {};
          objVertNeighbor.vertex = v;
          objVertNeighbor.place = point;
          objVertNeighbor.coords = new BABYLON.Vector3(0, 0, 0);
          objVertNeighbor.successors = [];
          fieldUp[neighbor[0]][neighbor[1]] = 2;
          verticies.push(objVertNeighbor); // upper successors
          //console.log("low vertex ", i + 1, " connects upper ", v);
          //console.log("low place ", objVert.place, " up place", point);
        }
      });
    }
    startIndex = endIndex + 1;
    endIndex = v - 1;
  }
  return verticies;
};

const showTree3D = function (graph, nLevels, material) {
  const tree = new BABYLON.TransformNode("root");
  const coneDir = new BABYLON.Vector3(0, 1, 0);
  const diams = [];
  
  for (let i = 0; i < nLevels; i++) {
    //diams.push(0.1 * (nLevels / (0.5 * i + 2)));
    diams.push(0.1 * (nLevels)/(i * i + 2));
  }

  graph[0].coords.x = graph[0].place[0];
  graph[0].coords.y = graph[0].place[1];
  graph[0].coords.z = graph[0].place[2];
  graph.forEach((vert) => {
    //console.log("vert= ", vert);
    const dLow = diams[vert.place[1]];
    vert.successors.forEach((w) => {
      //console.log("w= ", w);
      let randomShift1 = 0.5 * (Math.random() - 0.5);
      let randomShift2 = 0.99 * (Math.random() - 0.5);
      let randomShift3 = 0.5 * (Math.random() - 0.5);
      if (w < 3) {
        randomShift1 = 0;
        randomShift2 = 0;
        randomShift3 = 0;
      }
      arrowEnd = graph[w - 1];
      arrowEnd.coords.x = arrowEnd.place[0] + randomShift1;
      arrowEnd.coords.y = arrowEnd.place[1] + randomShift2;
      arrowEnd.coords.z = arrowEnd.place[2] + randomShift3;

      const dUp = diams[arrowEnd.place[1]];
      const sub = vert.coords.subtract(arrowEnd.coords);
      console.log("sub= ", sub);
      let l = sub.length();
      const cone = BABYLON.MeshBuilder.CreateCylinder("cylinder", {
        diameterTop: dUp,
        diameterBottom: dLow,
        height: l,
        tessellation: 5,
      });
      //const coneMaterial = new BABYLON.StandardMaterial("material", scene);
      cone.material = material;
      cone.parent = tree;
      //arbitraryRotation(coneDir, sub, cone);

      if (
        !(
          vert.coords.x === arrowEnd.coords.x &&
          vert.coords.z === arrowEnd.coords.z
        )
      ) {
        arbitraryRotation(coneDir, sub, cone);
      }

      cone.position = new BABYLON.Vector3(
        (vert.coords.x + arrowEnd.coords.x) / 2,
        (vert.coords.y + arrowEnd.coords.y) / 2,
        (vert.coords.z + arrowEnd.coords.z) / 2
      );
    });
  });
  tree.scaling.y = 0.99;
  return tree;
};

