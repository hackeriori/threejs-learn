<template>
  <div class="h-full p-2 overflow-y-auto space-y-2">
    <div v-for="item in showInListRouters" :key="item.path">
      <router-link class="hover:text-primary" :to="{
        name: item.name,
        query: item.meta?.query ?? {},
        params: item.meta?.params ?? {}
      }">
        {{ item.name }}
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {routes} from './router';

const showInListRouters = computed(() => routes.filter(x => (x.meta == null) || (x.meta.showInList === true || x.meta.showInList === undefined)));
</script>
