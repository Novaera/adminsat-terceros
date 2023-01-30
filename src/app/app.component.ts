import { AfterViewInit, Component } from '@angular/core';
import { Firestore, collection, query, onSnapshot, orderBy, QueryDocumentSnapshot, DocumentData, collectionData, where } from '@angular/fire/firestore';
import { FormBuilder, UntypedFormBuilder } from '@angular/forms';
import { Observable } from 'rxjs';
import { LeafletMap } from '@sersol/ngx-leaflet';
import { circleMarker, geoJSON, LayerGroup } from 'leaflet';
import { formatDate } from '@angular/common';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {
  title = 'adminsat-terceros';
  item$: Observable<any[]> | undefined;
  private leafletInstance!: LeafletMap;
  private layerGroup = new LayerGroup();
  private data!: any[];
  modelForm = this._fb.group({
    placa: [],
    dni: [],
    start: [],
    end: [],
  });

  constructor(private _fs: Firestore, private _fb: UntypedFormBuilder) {
  }

  ngAfterViewInit() {

    this.getAll();

    this.leafletInstance = new LeafletMap({
      container: 'map'
    });

    this.leafletInstance.map.setView([4.6288702, -74.1193724], 11);

    this.layerGroup.addTo(this.leafletInstance.map);

  }

  applyFilters() {
    this.updateMap(this.data);
  }

  updateMap(docs: DocumentData[]) {

    this.layerGroup.clearLayers();

    var FeatureCollection: any = {
      type: 'FeatureCollection',
      features: [] as any[]
    }

    docs
    .filter(x => this.modelForm.value.placa ? x['placa'].toUpperCase() === this.modelForm.value.placa.toUpperCase() : x)
    .filter(x => this.modelForm.value.dni ? x['dni'].toUpperCase() === this.modelForm.value.dni.toUpperCase() : x)
    .map(x => {
      x['date'] = new Date(x['time_millis']);
      return x
    })
    .filter(x => this.modelForm.value.start ? x['date'] >= this.modelForm.value.start : x)
    .filter(x => this.modelForm.value.end ? x['date'] <= this.modelForm.value.end : x)
    .forEach((x, i) => {

      const data = x;

      FeatureCollection.features.push({
        type: 'Feature',
        properties: {
          bgColor: i == 0 ? 'orange' : (data['gps'] === 1 ? 'green' : 'red'),
          tooltip: `
            <div>Fecha: <strong>${formatDate(data['date'], 'medium', 'en')}</strong></div>
            <div>Bateria: <strong>${data['battery']}</strong></div>
            <div>Placa: <strong>${data['placa']}</strong></div>
            <div>DNI: <strong>${data['dni']}</strong></div>
          `
        },
        geometry: {
          "type": "Point",
          "coordinates": [data['lon'], data['lat']]
        }
      });

    });

    const geojson = geoJSON(FeatureCollection, {
      pointToLayer: function (feature, latlng) {
        return circleMarker(latlng, {
          fillColor: feature.properties.bgColor,
          color: '#000',
          weight: 3,
          opacity: 1,
          fillOpacity: 0.5
        });
      },
      onEachFeature: function (feature, layer) {

        layer.bindTooltip(`<div class="details">${feature.properties.tooltip}</div>`);

      }
    });

    if (FeatureCollection.features.length > 0) {
      this.layerGroup.addLayer(geojson);
      const last = FeatureCollection.features[0].geometry.coordinates;
      this.leafletInstance.map.flyTo([last[1], last[0]], 18);
    }

    // this.leafletInstance.map.fitBounds(geojson.getBounds());
  }

  getAll() {

    collectionData(
      query(
        collection(this._fs, "adminsat"),
        orderBy('time_millis', 'desc'),
      )
    )
    .subscribe(x => {
      this.data = x;
      this.updateMap(x);
    });
  }


}
