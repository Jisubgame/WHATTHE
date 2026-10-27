-- Config (ModuleScript) — ReplicatedStorage/Config
-- The ward as a 33x33 grid: 0 = floor, 1 = wall, 3 = exit. Rows are north (r=0) to south.
local Config = {}

Config.CELL = 14          -- studs per grid cell (about 4 m)
Config.WALL_HEIGHT = 12   -- studs
Config.SIZE = 33
Config.CENTER = 16

Config.GRID = {
		"111111111111111111111111111111111",
		"100000100000111101111100000000001",
		"101010101111111101111111110011101",
		"100010001000111101111110000000101",
		"101110111010111101111110110111101",
		"101010000010000000000100000000001",
		"101011101010101101101110110110111",
		"100000101010100000001100000000001",
		"111111101110101000101111110111101",
		"100010101000000000101111110111101",
		"101110101010101100101111110111101",
		"100000100010100000101111110111101",
		"111010101010111001111111110111101",
		"100010101010000000000000000000001",
		"101010111110111101101111110111101",
		"101010000010100000001111110111101",
		"101010111110111000101111110111101",
		"101010000000000000101111110111101",
		"101110101110111001101111110111101",
		"100000101000100000001100000000001",
		"111011101110111000111111110111101",
		"101000101000000000000111110111101",
		"101010111010111101111111110111101",
		"100010001000000001111111110111101",
		"101111101110111101111111110111101",
		"100000000010111101111100000000001",
		"111010111111111101111110110110111",
		"111000000000000001111100100000001",
		"111110111111000000000110101011101",
		"111110111111000000000100101010001",
		"111110000000000000000111111010101",
		"111111111111000000000100000000101",
		"111111111111111111111111111113111",
}

Config.SPAWN = {30, 16}        -- lobby (r, c)
Config.MONSTER_SPAWN = {1, 9}
Config.EXIT = {32, 29}
Config.PATROL_NODES = { {13, 15}, {11, 9}, {7, 19}, {21, 17}, {19, 31}, {7, 29}, {27, 29}, {21, 3}, {5, 7}, {31, 27}, {7, 3}, {27, 13}, {5, 13}, {13, 26}, {25, 5}, {3, 1} }
Config.LOCKERS = { {24, 16}, {7, 30}, {20, 26}, {7, 7}, {19, 14}, {21, 10}, {30, 31}, {18, 19}, {27, 7}, {2, 31}, {13, 25}, {15, 3}, {3, 9}, {8, 13}, {16, 31}, {23, 2}, {14, 16}, {1, 1} }
Config.SAFE = { [2716] = true, [2812] = true, [2813] = true, [2814] = true, [2815] = true, [2816] = true, [2817] = true, [2818] = true, [2819] = true, [2820] = true, [2912] = true, [2913] = true, [2914] = true, [2915] = true, [2916] = true, [2917] = true, [2918] = true, [2919] = true, [2920] = true, [3012] = true, [3013] = true, [3014] = true, [3015] = true, [3016] = true, [3017] = true, [3018] = true, [3019] = true, [3020] = true, [3112] = true, [3113] = true, [3114] = true, [3115] = true, [3116] = true, [3117] = true, [3118] = true, [3119] = true, [3120] = true }   -- key = r*100 + c : the lit lobby, it never comes in
Config.VENT = { [2605] = true, [2705] = true, [2805] = true, [2905] = true, [3005] = true, [3006] = true, [3007] = true, [3008] = true, [3009] = true, [3010] = true, [3011] = true }   -- crawl-only ducts

-- speeds in studs/second (1 m ~ 3.5 studs)
Config.PLAYER_WALK = 12
Config.PLAYER_SPRINT = 20
Config.MONSTER_PATROL = 9.5
Config.MONSTER_CHASE = 20.5
Config.SIGHT_RANGE = 70       -- with a flashlight on; 32 without (later step)
Config.LOSE_SIGHT_TIME = 5

-- multiplayer: every extra player makes it a little faster and sharper
Config.PER_PLAYER_SPEED = 0.06
Config.PER_PLAYER_SIGHT = 0.08

function Config.cellToWorld(r, c)
	return Vector3.new((c - Config.CENTER) * Config.CELL, 0, (r - Config.CENTER) * Config.CELL)
end

function Config.worldToCell(pos)
	local c = math.floor(pos.X / Config.CELL + Config.CENTER + 0.5)
	local r = math.floor(pos.Z / Config.CELL + Config.CENTER + 0.5)
	return r, c
end

function Config.cellAt(r, c)
	local row = Config.GRID[r + 1]
	if not row or c < 0 or c >= Config.SIZE then return 1 end
	return tonumber(string.sub(row, c + 1, c + 1))
end

function Config.isSafe(pos)
	local r, c = Config.worldToCell(pos)
	return Config.SAFE[r * 100 + c] == true
end

return Config
