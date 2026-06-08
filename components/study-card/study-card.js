Component({
  properties: {
    item: {
      type: Object,
      value: {}
    }
  },
  methods: {
    handleTap() {
      this.triggerEvent('tap', this.properties.item);
    }
  }
});
