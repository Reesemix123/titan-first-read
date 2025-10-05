// src/types/football.ts

export interface Player {
  position: string;
  x: number;
  y: number;
  label: string;
  id?: string;
}

export interface RoutePoint {
  x: number;
  y: number;
}

export interface Route {
  playerId: string;
  path: RoutePoint[];
  type?: 'pass' | 'run' | 'block';
  routeType?: string;
}

export interface Block {
  playerId: string;
  targetX: number;
  targetY: number;
  blockType?: string;
}

export interface Motion {
  playerId: string;
  path: RoutePoint[];
  motionType?: string;
}

export type Formation = 'offense' | 'defense' | 'special';

export interface Play {
  id?: string;
  name: string;
  formation: string;
  players: Player[];
  routes: Route[];
  blocks: Block[];
  motions: Motion[];
  teamId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}