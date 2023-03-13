<template>
  <a-modal
    v-model:visible="visible"
    title="Add Symbol"
    @cancel="emits('close')"
    @ok="handleOk"
  >
    <a-row>
      <a-col :span="4">
        <p>Symbol</p>
      </a-col>
      <a-col :span="20">
        <a-auto-complete
          v-model:value="option"
          :options="options"
          style="width: 200px"
          placeholder="Select Symbol"
          @search="onSearch"
        />
      </a-col>
    </a-row>
    <template #footer>
      <a-button @click="emits('close')">Cancel</a-button>
      <a-button type="primary" @click="handleOk">Add</a-button>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import { message } from "ant-design-vue";
import { ref, watch } from "vue";
import { ExchangeInfoSymbol } from "../../models/trade";

interface SymbolOption {
  symbol: string;
  value: string;
}

const props = defineProps<{
  visible: boolean;
  exchangeInfoSymbols: ExchangeInfoSymbol[];
}>();

const emits = defineEmits(["close", "ok"]);

const visible = ref(false);

const option = ref<SymbolOption>();

watch(
  () => props.visible,
  (val) => {
    visible.value = val;
  }
);

const handleOk = () => {
  if (!option.value) message.warning("Please select a symbol");
  else emits("ok", option.value);
};

const options = ref<SymbolOption[]>(
  props.exchangeInfoSymbols.map((t) => ({ symbol: t.symbol, value: t.symbol }))
);
const originalOptions = ref<SymbolOption[]>(options.value);

const onSearch = (searchText: string) => {
  options.value = originalOptions.value.filter((o) =>
    o.symbol.toUpperCase().includes(searchText.toUpperCase())
  );
};
</script>
